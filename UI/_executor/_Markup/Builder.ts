/// <amd-module name="UI/_executor/_Markup/Builder" />
/* tslint:disable */

import { Logger } from 'UI/Utils';
import { Subscriber } from 'UI/Events';
import { ContextResolver } from 'UI/Contexts';
import * as OptionsResolver from '../_Utils/OptionsResolver';
import * as AppEnv from 'Application/Env';
import * as AppInit from 'Application/Initializer';
import { isNewEnvironment } from 'UI/Utils';
import { IBuilder } from './IBuilder';

import { invisibleNodeCompat, isInstOfPromise, asyncRenderErrorTag } from './Utils'
import { needWaitAsync } from '../_Utils/Common';

/**
 * @author Тэн В.А.
 */
export class Builder implements IBuilder {
   buildForNewControl(scope, cnstr, decOptions) {
      var _options = scope.user;

      var dfd, result;

      _options['class'] = decOptions['class'];

      var eventsList = Subscriber.getEventsListFromOptions(_options);
      for (var key in eventsList) {
         if (eventsList.hasOwnProperty(key)) {
            delete _options[key];
         }
      }

      // не регаем тут контрол в паренте, потому что этот контрол нужен только для построения верстки, реальный контрол создастся при первой же синхронизации
      var doNotSetParent = _options.doNotSetParent;
      _options.doNotSetParent = true;

      var parentName = (_options._logicParent && _options._logicParent._moduleName) || '';
      var defaultOpts = OptionsResolver.getDefaultOptions(cnstr);
      OptionsResolver.resolveOptions(cnstr, defaultOpts, _options, parentName);

      var inst = new cnstr(_options),
         actualOptions = _options;

      actualOptions.doNotSetParent = doNotSetParent;

      /**
       * TODO: удалить это. По идее, VDOM контролы не должны генерировть строку если они в window
       */
      if (typeof window !== 'undefined') {
         Subscriber.subscribeEvents(inst, scope.internal.logicParent, eventsList);
      }
      if (inst._template) {
         /**
          * Сделать final проверку
          */
         if (inst.saveOptions) {
            inst.saveOptions(actualOptions);
         } else {
            inst._options = actualOptions;
         }

         // Freeze options if control doesn't have compatible layer
         if (Object.freeze && !(inst.hasCompatible && inst.hasCompatible())) {
            Object.freeze(inst._options);
         }

         try {
            dfd = inst.__beforeMount && inst.__beforeMount(actualOptions, scope.templateContext || {});
         } catch (error) {
            // @ts-ignore
            if(typeof process !== 'undefined' && !process.versions) {
               // TODO: проблема при построении на СП, если _beforeMount возвращает Promise, от которого зависит вычисление опций,
               // передаваемых в дочерние контролы, в которых тоже возвращаются Promise(и т.д.)
               // после 20 секунд на СП, мы прекращаем рендерить и отдаем все, что успели построить, но
               // контролы которые не успели получить ответ от БЛ строятся с дефолтными значениями, которые отдаются в опции детей
               // скорее всего надо как-то менять шаблонизатор, чтобы не лез строить детей на сервере дальше.
               Logger.error(`При построении на СП _beforeMount контрола ${inst._moduleName} (logicParent: ${parentName}) возникла проблема.
                  Возможные причины:
                  - выполнение метода БЛ занимает более 20 секунд
                  - бесконечный Promise в _beforeMount
                  - суммарное время построения контрола и его детей больше 20 секунд`, inst);
            }
         }

         //TODO пропустить через contextResolver(где взять класс?)
         inst.saveInheritOptions(scope.inheritOptions || {});

         /**
          * Понимаем асинхронная ветка или нет
          */
         if (needWaitAsync() && dfd && isInstOfPromise(dfd)) {
            if(!isNewEnvironment()) {
               var message = '[UI/_executor/GeneratorDefault:buildForNewControl()] You are using asynchronous rendering inside of the old environment.';
               Logger.warn(message, inst);
            }
            return new Promise(function (resolve) {
               dfd.then(function (receivedState) {
                  inst._saveContextObject(ContextResolver.resolveContext(cnstr, scope.templateContext || {}, inst));
                  inst.saveFullContext(ContextResolver.wrapContext(inst, scope.templateContext || {}));
                  if (AppInit.isInit()) {
                     let sr = AppEnv.getStateReceiver();
                     sr && sr.register(scope.key, {
                        getState: function () {
                           return { receivedState, moduleName: inst._moduleName };
                        },
                        setState: function () {
                        }
                     });
                  }
                  result = inst._template ? inst.render(null, decOptions) : '';
                  if (result.then) {
                     result.then(function (res) {
                        resolve({
                           result: res,
                           receivedState: receivedState
                        });
                     }, function (err) {
                        Logger.asyncRenderErrorLog(err, inst);
                        resolve({
                           result: asyncRenderErrorTag(inst),
                           receivedState: undefined
                        });
                     });
                  } else {
                     resolve({
                        result: result,
                        receivedState: receivedState
                     });
                  }
               }, function (err) {
                  Logger.asyncRenderErrorLog(err, inst);
                  resolve({
                     result: asyncRenderErrorTag(inst),
                     receivedState: undefined
                  });
               });
            });
         } else {
            inst._saveContextObject(ContextResolver.resolveContext(cnstr, scope.templateContext || {}, inst));
            inst.saveFullContext(ContextResolver.wrapContext(inst, scope.templateContext || {}));
         }
      }
      result = inst._template ? invisibleNodeCompat(inst.render(undefined, decOptions)) : '';
      return result;
   };
}
