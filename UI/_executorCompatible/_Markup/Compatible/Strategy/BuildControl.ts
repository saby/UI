/// <amd-module name="UI/_executor/_Markup/Compatible/Strategy/BuildControl" />
/* tslint:disable */

import {
   tabIndexFixCompatible,
   setBindingCompatible,
   mergeCompatible,
   dataComponentFixCompatible,
   resolveContextCompatible,
   saveConfigCompatible,
   fixCompatible
} from '../Helper';
import { Logger } from 'UI/Utils';
import { Subscriber } from 'UI/Events';
import { ContextResolver } from 'UI/Contexts';
import * as Decorate from 'UI/_executor/_Expressions/Decorate';
import * as Attr from 'UI/_executor/_Expressions/Attr';
import { _FocusAttrs } from 'UI/Focus';
import * as Common from 'UI/_executor/_Utils/Common';
// @ts-ignore
import * as Serializer from 'Core/Serializer';
import * as AppInit from 'Application/Initializer';

// @ts-ignore
import * as randomId from 'Core/helpers/Number/randomId';
import voidElements from 'UI/_executor/_Utils/VoidTags';

import { IBuilderScope, TAttributes, TObject } from 'UI/_executor/_Markup/IGeneratorType';
import {
   IControlCompatible,
   IEvent,
   IInstanceExtendetCompatible,
   TReceivedState
} from '../ICompatibleType';

interface IBuildControl {
   buildForNewControl(scope: IBuilderScope,
                      cnstr: Function,
                      decOptions: TAttributes): TObject | string;
}

/**
 * @author Тэн В.А.
 */
export abstract class BuildControl implements IBuildControl {
   abstract subscribeEvents(inst: IInstanceExtendetCompatible, logicParent: IControlCompatible | void, eventsList: IEvent[]): void;

   abstract saveContextFix(options, inst: IInstanceExtendetCompatible): void;

   abstract checkAsyncResult(result: Promise<unknown> | TObject, inst: IInstanceExtendetCompatible): void;

   abstract prepareStateReceiver(key: string, receivedState: TReceivedState): void;

   buildForNewControl(scope, cnstr, decOptions) {
      let _options = scope.user;

      let dfd;
      let result;

      _options['class'] = decOptions['class'];

      _options = tabIndexFixCompatible(scope, decOptions, _options);

      const eventsList = Subscriber.getEventsListFromOptions(_options) as IEvent[];
      for (let key in eventsList) {
         if (eventsList.hasOwnProperty(key)) {
            delete _options[key];
         }
      }

      // не регаем тут контрол в паренте, потому что этот контрол нужен только для построения верстки, реальный контрол создастся при первой же синхронизации
      const doNotSetParent = _options.doNotSetParent;
      _options.doNotSetParent = true;

      const callback = setBindingCompatible(scope, _options, cnstr);
      _options = callback._options;
      scope = callback.scope;

      const instCompat = mergeCompatible(scope, _options, cnstr);
      let inst = instCompat.instance;
      let actualOptions = instCompat.resolvedOptions;

      actualOptions.doNotSetParent = doNotSetParent;

      /**
       * TODO: удалить это. По идее, VDOM контролы не должны генерировть строку если они в window
       */
      this.subscribeEvents(inst, scope.internal.logicParent, eventsList);
      /**
       * Вызываем события на сервере. Контролы VDOM должны попадать в это условие только там.
       */
      this.saveContextFix(_options, inst);

      if (inst._template) {
         /**
          * Сделать final проверку
          */
         if (inst.saveOptions) {
            inst.saveOptions(actualOptions);
         } else {
            inst._options = actualOptions;
         }
         // костыль, снова применяю биндинги после отката опций на actualOptions
         this.saveContextFix(_options, inst);
         // Freeze options if control doesn't have compatible layer
         if (Object.freeze && !(inst.hasCompatible && inst.hasCompatible())) {
            Object.freeze(inst._options);
         }

         try {
            dfd = inst._beforeMountLimited && inst._beforeMountLimited(actualOptions, scope.templateContext || {});
         } catch (error) {
            Logger.lifeError('_beforeMount', inst, error);
         }
         inst._beforeMountCalled = true;

         //TODO пропустить через contextResolver(где взять класс?)
         inst.saveInheritOptions(scope.inheritOptions || {});

         decOptions = dataComponentFixCompatible(decOptions, scope);
         /**
          * Понимаем асинхронная ветка или нет
          */
         if (dfd && this.isInstOfPromise(dfd)) {
            // FIXME: В 6100 заменить на ошибку
            // Logger.warn(`Ошибка построения разметки. Обнаружен асинхронный _beforeMount в ws3-окружении`, inst);
            // FIXME: удалить асинхронную ветку в 7100
            let _self = this;
            return new Promise(function(resolve) {
               dfd.then(function(receivedState) {
                  inst._saveContextObject(resolveContextCompatible(cnstr, scope.templateContext || {}, inst));
                  inst.saveFullContext(ContextResolver.wrapContext(inst, scope.templateContext || {}));

                  let result;
                  inst = <IInstanceExtendetCompatible> Common.plainMerge(inst, receivedState);
                  _options.__$receivedState = receivedState;

                  if (AppInit.isInit()) {
                     _self.prepareStateReceiver(scope.key, receivedState);
                  }

                  result = inst._template ? inst.render(null, {attributes: decOptions, key: scope.key}) : '';

                  if (result.then) {
                     result.then(function(res) {
                        resolve({
                           result: _self.makeInlineConfigs(res, scope.key, receivedState),
                           receivedState: receivedState
                        });
                     }, function(err) {
                        Logger.asyncRenderErrorLog(err, inst);
                        resolve({
                           result: _self.asyncRenderErrorTag(inst),
                           receivedState: undefined
                        });
                     });
                  } else {
                     if (!scope.internal || !scope.internal.logicParent) {
                        saveConfigCompatible(_options.__$config, inst);
                     }
                     /**
                      * Для описания конфигов в script
                      */
                     result = _self.makeInlineConfigs(result, scope.key, receivedState);

                     resolve({
                        result: result,
                        receivedState: receivedState
                     });
                  }
               }, function(err) {
                  Logger.asyncRenderErrorLog(err, inst);
                  resolve({
                     result: _self.asyncRenderErrorTag(inst),
                     receivedState: undefined
                  });
               });
            });
         } else {
            inst._saveContextObject(resolveContextCompatible(cnstr, scope.templateContext || {}, inst));
            inst.saveFullContext(ContextResolver.wrapContext(inst, scope.templateContext || {}));
         }
      }
      result = inst._template ? this.invisibleNodeCompat(inst.render(undefined, {attributes: decOptions})) : '';
      fixCompatible(inst, decOptions, scope, _options);
      this.checkAsyncResult(result, inst);

      return result;
   };

   private isInstOfPromise(entity: Promise<any>): unknown {
      return entity && entity.then;
   };

   // FIXME: удалить асинхронную ветку в 7100
   private makeInlineConfigs(res: TObject, optionsConfig: string, receivedState: TObject): unknown {
      const ser = this.serializeReceivedState(receivedState);
      return res +
         '<script type="text/javascript" data-vdomignore="true">window.inline' +
         optionsConfig.replace('cfg-', '') +
         '=\'' +
         ser +
         '\';</script>';

   };

   // FIXME: удалить асинхронную ветку в 7100
   private serializeReceivedState(receivedState: TObject): unknown {
      const slr = new Serializer();
      let ser = JSON.stringify(receivedState, slr.serialize);

      // заменяем опасные символы, коотрые могут привести к синтаксическим ошибкам
      Common.componentOptsReArray.forEach(function (re) {
         ser = ser.replace(re.toFind, re.toReplace);
      });
      return ser;
   };

   // FIXME: удалить асинхронную ветку в 7100
   private asyncRenderErrorTag(inst: IInstanceExtendetCompatible): string {
      var decoratorObject = {}, options;
      if (inst && inst._options) {
         options = inst._options;
         decoratorObject = Decorate.createRootDecoratorObject(
            options['__$config'],
            true,
            options['data-component'],
            {}
         );
      }
      return this.createTag('div', { attributes: decoratorObject }, []);
   };

   private invisibleNodeCompat(markup: string): string {
      return markup && markup.indexOf && markup.indexOf('<invisible-node') === 0 ?
         markup.replace(/invisible-node/g, 'div') : markup;
   };

   joinAttrs = Attr.joinAttrs;

   createTag(tag, attrs, children, attrToDecorate?, defCollection?, control?) {
      if (!attrToDecorate) {
         attrToDecorate = {};
      }
      if (!attrs) {
         attrs = {};
      }

      var mergedAttrs = Attr.processMergeAttributes(attrToDecorate.attributes, attrs.attributes, true);

      _FocusAttrs.prepareTabindex(mergedAttrs);
      // remove focus attributes from object

      var mergedAttrsStr = mergedAttrs
         ? this.decorateAttrs(mergedAttrs, {})
         : '';

      if (~voidElements.indexOf(tag)) {
         return '<' + tag + mergedAttrsStr + ' />';
      }
      return '<' + tag + mergedAttrsStr + '>' + this.joinElements(children, undefined, defCollection) + '</' + tag + '>';
   };

   joinElements(elements, key, defCollection) {
      if (Array.isArray(elements)) {
         var res = '';
         var _self = this;
         elements.forEach(function joinOneElement(element) {
            var id;
            if (Array.isArray(element)) {
               element = _self.joinElements(element, undefined, defCollection);
            }
            if (element && _self.isInstOfPromise(element)) {
               id = randomId('def-');
               if (!defCollection.def) {
                  defCollection.def = [];
               }
               defCollection.def.push(element);
               element = '[' + id + ']';
               defCollection.id.push(element);
            }
            res += (element || '');
         });

         return res;
      } else {
         throw new Error('joinElements: elements is not array');
      }
   };

   decorateAttrs(attr1, attr2) {
      function wrapUndef(value) {
         if (value === undefined || value === null) {
            return "";
         } else {
            return value;
         }
      }

      var attrToStr = function (attrs) {
         var str = '';
         for (var attr in attrs) {
            if (attrs.hasOwnProperty(attr)) {
               str += (wrapUndef(attrs[attr]) !== '' ? ' ' + (attr + '="' + attrs[attr] + '"') : '');
            }
         }
         return str;
      };
      return attrToStr(this.joinAttrs(attr1, attr2));
   };
}
