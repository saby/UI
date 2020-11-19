/// <amd-module name="UI/_executor/_Markup/Generator" />
/* tslint:disable */

import { coreDebug as timing } from 'Env/Env';
import { Logger } from 'UI/Utils';
import * as Common from '../_Utils/Common';
import * as RequireHelper from '../_Utils/RequireHelper';
import * as OptionsResolver from '../_Utils/OptionsResolver';
import * as Scope from '../_Expressions/Scope';
import { EventUtils } from 'UI/Events';
import * as ConfigResolver from '../_Utils/ConfigResolver'
import {
   GeneratorEmptyObject,
   GeneratorObject,
   GeneratorTemplateOrigin,
   IControl,
   IControlData,
   ICreateControlTemplateCfg,
   IGeneratorAttrs,
   IGeneratorConfig,
   IGeneratorDefCollection,
   TDeps,
   TIncludedTemplate,
   TObject,
   IControlUserData,
   IControlConfig
} from 'UI/_executor/_Markup/IGeneratorType';
import * as Helper from 'UI/_executor/_Markup/Helper';

const defRegExp = /(\[def-[\w\d]+\])/g;

function calculateDataComponent(tplOrigin) {
   let dataComponent;
   // При использовании ts-модуля, где нужный класс экспортируется дефолтно, внутри js-модуля
   // сюда приходит объект tplOrigin, где __esModule есть true, а в default лежит нужная нам функция построения верстки
   // Для того, чтобы верстка строилась, необходимо вытащить функцию из default
   let tpl = tplOrigin && tplOrigin.__esModule && tplOrigin.default ? tplOrigin.default : tplOrigin;
   if (typeof tpl === 'function') {
      dataComponent = tpl.prototype ? tpl.prototype._moduleName : '';
      dataComponent = dataComponent || tpl.name;
   }
   if (typeof tpl === 'string') {
      if (Common.isLibraryModuleString(tpl)) {
         // if this is a module string, it probably is from a dynamic partial template
         // (ws:partial template="{{someString}}"). Split library name and module name
         // here and process it in the next `if tpl.library && tpl.module`
         tpl = Common.splitModule(tpl);
      } else {
         const newName = Common.splitWs(tpl);
         if (newName) {
            tpl = newName;
         }

         tpl = tpl.replace('optional!', '');
         dataComponent = tpl;
      }
   }

   if (tpl && tpl.library && tpl.module) {
      // module type: { library: <requirable module name>, module: <field to take from the library> }
      let moduleName = tpl.library + ':' + tpl.module.join('.');
      dataComponent = moduleName;
   }

   if (Array.isArray(tpl) && tpl[0] && tpl[0].func && tpl[0].func.name) {
      dataComponent = tpl[0].func.name.replace('bound ', 'контентная опция ');
   }
   if (Array.isArray(tpl) && tpl[0] && typeof tpl[0] === 'function' && tpl[0].name) {
      dataComponent = tpl[0].name.replace('bound ', 'контентная опция ');
   }
   if (tpl && tpl.func && tpl.func.name) {
      dataComponent = tpl.func.name.replace('bound ', 'контентная опция ');
   }

   return dataComponent;
}

function isLibraryTpl(tpl, deps) {
   if (typeof tpl === 'object' && tpl && tpl.library && tpl.module) {
      let controlClass;
      // module type: { library: <requirable module name>, module: <field to take from the library> }
      let moduleName = tpl.library + ':' + tpl.module.join('.');
      if (deps && deps[tpl.library]) {
         controlClass = Common.extractLibraryModule(deps[tpl.library], tpl.module);
      } else if (RequireHelper.defined(tpl.library)) {
         controlClass = Common.extractLibraryModule(RequireHelper.extendedRequire(tpl.library, tpl.module), tpl.module);
      } else {
         const mod = this.cacheModules[tpl.library];
         if (mod) {
            controlClass = Common.extractLibraryModule(this.cacheModules[tpl.library], tpl.module);
         } else {
            moduleName = undefined;
         }
      }
      if (controlClass && controlClass.prototype && !controlClass.prototype.hasOwnProperty('_moduleName')) {
         // Patch controlClass prototype, it won't have a _moduleName the first time it is
         // created, because it was exported in a library
         controlClass.prototype._moduleName = moduleName;
      }
      return [controlClass, moduleName];
   }
   return [undefined, undefined];
}

function resolveTpl(tpl, deps, includedTemplates) {
   let dataComponent;

   if (tpl === '_$inline_template') {
      return ['_$inline_template', undefined];
   }
   if (typeof tpl === 'function') {
      dataComponent = tpl.prototype ? tpl.prototype._moduleName : '';
      return [tpl, dataComponent];
   }
   if (typeof tpl === 'string') {
      if (Common.isLibraryModuleString(tpl)) {
         // if this is a module string, it probably is from a dynamic partial template
         // (ws:partial template="{{someString}}"). Split library name and module name
         // here and process it in the next `if tpl.library && tpl.module`
         tpl = Common.splitModule(tpl);
         return isLibraryTpl.call(this, tpl, deps);
      }
      let isSlashes;
      let wasOptional;
      let controlClass;
      const newName = Common.splitWs(tpl);
      if (newName) {
         tpl = newName;
      }

      if (tpl.indexOf('/') > -1) {
         isSlashes = true;
         if (tpl.indexOf('optional!') > -1) {
            wasOptional = true;
            tpl = tpl.replace('optional!', '');
         }
      }

      if (includedTemplates && includedTemplates[tpl]) {
         controlClass = includedTemplates[tpl];
      }

      if (!controlClass) {
         controlClass = deps && (deps[tpl] || deps['optional!' + tpl]);
      }

      if (controlClass && controlClass.hasOwnProperty('default')) {
         controlClass = controlClass.default;
      }

      if (!controlClass) {
         if (!isSlashes || wasOptional || Common.isCompat()) {
            /*
               * it can be "optional"
               * can be tmpl!
               * */
            if (RequireHelper.defined(tpl)) {
               controlClass = RequireHelper.require(tpl);
            }
         } else {
            try {
               if (!this.cacheModules[tpl] && RequireHelper.defined(tpl)) {
                  this.cacheModules[tpl] = RequireHelper.require(tpl);
               }
               controlClass = this.cacheModules[tpl];
            } catch (e) {
               Logger.error('Create component error', controlClass, e);
            }
         }
      }
      dataComponent = tpl;
      if (controlClass && controlClass.default && controlClass.default.isWasaby) {
         controlClass = controlClass.default;
      }
      return [controlClass, dataComponent];
   }
   return isLibraryTpl(tpl, deps);
}

function isCompatPatch(controlClass, controlProperties, attrs, fromOld) {
   if (controlProperties && controlProperties.enabled === undefined) {
      const internal = attrs.internal;
      if (internal && internal.parent && fromOld) {
         if (internal.parentEnabled !== undefined && controlProperties.allowChangeEnable !== false) {
            controlProperties.enabled = internal.parentEnabled;
         } else {
            controlProperties.enabled = true;
         }
      } else if (fromOld && internal.parentEnabled === false) {
         controlProperties.__enabledOnlyToTpl = internal.parentEnabled;
      }
   }

   if (fromOld) {
      const objForFor = attrs.attributes;
      for (let i in objForFor) {
         if (objForFor.hasOwnProperty(i) && EventUtils.isEvent(i)) {
            controlProperties[i] = objForFor[i];
         }
      }
   }
   return controlProperties;
}

function dataResolver(data: IControlData,
                      templateCfg: ICreateControlTemplateCfg,
                      attrs: IGeneratorAttrs,
                      name: GeneratorTemplateOrigin): [IControlData, IControlUserData, IGeneratorAttrs] {
   data = ConfigResolver.resolveControlCfg(data, templateCfg, attrs, calculateDataComponent(name));
   data.internal.logicParent = data.internal.logicParent || templateCfg.viewController;
   data.internal.parent = data.internal.parent || templateCfg.viewController;

   attrs.internal = data.internal;
   const userData = data.user;
   return [data, userData, attrs];
}

function nameResolver(name: GeneratorTemplateOrigin): GeneratorTemplateOrigin {
   // Здесь можем получить null  в следствии !optional. Поэтому возвращаем ''
   if (name === null) {
      return this.createEmptyText();
   }
   // конвертирую объект строки в строку, чтобы везде провеять только на строку
   // объект вместо строки вероятно приходит из-за интернационализации
   if (name instanceof String) {
      name = name.toString();
   }
   return name;
}

function checkResult(res: GeneratorObject | Promise<unknown> | Error,
                     type: string,
                     name: string): GeneratorObject | Promise<unknown> | Error {
   if (res !== undefined) {
      return res;
   }
   /**
    * Если у нас есть имя и тип, значит мы выполнили код выше
    * Функции шаблонизации возвращают undefined, когда работают на клиенте
    * с уже построенной версткой
    * А вот если нам не передали каких-то данных сюда, то мы ничего не строили,
    * а значит это ошибка и нужно обругаться.
    */
   if ((typeof name !== 'undefined') && type) {
      return this.createEmptyText();
   }
   if (typeof name === 'undefined') {
      Logger.error('Попытка использовать компонент/шаблон, ' +
         'но вместо компонента в шаблоне в опцию template был передан undefined! ' +
         'Если верстка строится неправильно, нужно поставить точку останова и исследовать стек вызовов. ' +
         'По стеку будет понятно, в каком шаблоне и в какую опцию передается undefined');
      return this.createEmptyText();
   }
   throw new Error('MarkupGenerator: createControl type not resolved');
}

/**
 * @author Тэн В.А.
 */
export class Generator {
   cacheModules: TObject;
   private createEmptyText: Function;
   private createWsControl: Function;
   private createTemplate: Function;
   private createController: Function;
   private resolver: Function;

   private prepareAttrsForPartial: Function;

   constructor(config: IGeneratorConfig) {
      if (config) {
         this.prepareAttrsForPartial = config.prepareAttrsForPartial;
      }
   }

   createControlNew(
      name: string,
      method: Function,
      attributes: Record<string, unknown>,
      events: Record<string, unknown>,
      options: any, // FIXME: Record<string, unknown>
      config: IControlConfig
   ): GeneratorObject | Promise<unknown> | Error {
      const decorAttribs = {
         attributes,
         events,
         context: config.context,
         inheritOptions: {},
         internal: config.internal,
         key: config.key
      };
      const actualAttributes = config.mergeType === 'attribute'
         ? Helper.plainMergeAttr(config.attr, decorAttribs)
         : config.mergeType === 'context'
            ? Helper.plainMergeContext(config.attr, decorAttribs)
            : decorAttribs;
      const actualOptions = config.scope === null ? options : Helper.uniteScope(config.scope, options);
      const actualConfig = {
         isRootTag: config.isRootTag,
         data: config.data,
         ctx: config.ctx,
         pName: config.pName,
         viewController: config.viewController,
         internal: config.internal
      };
      return this.createControl(
         'wsControl',
         name,
         actualOptions,
         actualAttributes,
         actualConfig,
         config.context,
         config.depsLocal,
         config.includedTemplates, Helper.config
      );
   }

   createTemplateNew(
      name: string,
      method: Function,
      attributes: Record<string, unknown>,
      events: Record<string, unknown>,
      options: any, // FIXME: Record<string, unknown>
      config: IControlConfig
   ): GeneratorObject | Promise<unknown> | Error {
      const decorAttribs = {
         attributes,
         events,
         context: config.context,
         inheritOptions: {},
         internal: config.internal,
         key: config.key
      };
      const actualAttributes = config.mergeType === 'attribute'
         ? Helper.plainMergeAttr(config.attr, decorAttribs)
         : config.mergeType === 'context'
            ? Helper.plainMergeContext(config.attr, decorAttribs)
            : decorAttribs;
      const actualOptions = config.scope === null ? options : Helper.uniteScope(config.scope, options);
      const actualConfig = {
         isRootTag: config.isRootTag,
         data: config.data,
         ctx: config.ctx,
         pName: config.pName,
         viewController: config.viewController,
         internal: config.internal
      };
      return this.createControl(
         'template',
         name,
         actualOptions,
         actualAttributes,
         actualConfig,
         config.context,
         config.depsLocal,
         config.includedTemplates, Helper.config
      );
   }

   resolveControlNew(
      name: string,
      method: Function,
      attributes: Record<string, unknown>,
      events: Record<string, unknown>,
      options: Record<string, unknown>,
      config: IControlConfig
   ): GeneratorObject | Promise<unknown> | Error {
      throw new Error('Not implemented yet');
   }

   resolveTemplateNew(
      name: string,
      method: Function,
      attributes: Record<string, unknown>,
      events: Record<string, unknown>,
      options: Record<string, unknown>,
      config: IControlConfig
   ): GeneratorObject | Promise<unknown> | Error {
      throw new Error('Not implemented yet');
   }

   chain(out: string, defCollection: IGeneratorDefCollection, inst?: IControl): Promise<string | void> | string | Error {
      function chainTrace(defObject: Array<any>): string {
         return out.replace(defRegExp, function (key) {
            const valKey = defCollection.id.indexOf(key);
            if (defObject[valKey] && defCollection.id[valKey]) {
               return defObject[valKey].result ? defObject[valKey].result : defObject[valKey];
            }
            if (defObject[valKey] === undefined) {
               Logger.asyncRenderErrorLog('Promise from chain return undefined value', inst);
            }
            return '';
         });
      }

      const Deferred = require('Core/Deferred');
      return Promise.all(defCollection.def).then(Deferred.skipLogExecutionTime(chainTrace), function (err) {
         Logger.asyncRenderErrorLog(err);
      });
   };

   prepareWsControl(name: GeneratorTemplateOrigin,
                    data: IControlData,
                    attrs: IGeneratorAttrs,
                    templateCfg: ICreateControlTemplateCfg,
                    context: string,
                    deps: TDeps): GeneratorObject | Promise<unknown> | Error {
      let preparedData = dataResolver(data, templateCfg, attrs, name);
      attrs = preparedData[2];
      const userData = preparedData[1];
      name = nameResolver.call(this, name);
      let res;
      const type = 'wsControl';
      if (Common.isCompat()) {
         res = timing.methodExecutionTime(this.createWsControl, this, [name, userData, attrs, context, deps]);
         return checkResult.call(this, res, type, name);
      }
      res = this.createWsControl(name, userData, attrs, context, deps);
      return checkResult.call(this, res, type, name);
   }

   prepareTemplate(name: GeneratorTemplateOrigin,
                   data: IControlData,
                   attrs: IGeneratorAttrs,
                   templateCfg: ICreateControlTemplateCfg,
                   context: string,
                   deps: TDeps,
                   config: IGeneratorConfig): GeneratorObject | Promise<unknown> | Error {
      let preparedData = dataResolver(data, templateCfg, attrs, name);
      attrs = preparedData[2];
      const userData = preparedData[1];
      name = nameResolver.call(this, name);
      let res;
      const type = 'template';
      if (Common.isCompat()) {
         res = timing.methodExecutionTime(this.createTemplate, this, [name, userData, attrs, context, deps, config]);
         return checkResult.call(this, res, type, name);
      }
      res = this.createTemplate(name, userData, attrs, context, deps, config);
      return checkResult.call(this, res, type, name);
   }

   prepareController(name: GeneratorTemplateOrigin,
                     data: IControlData,
                     attrs: IGeneratorAttrs,
                     templateCfg: ICreateControlTemplateCfg,
                     context: string,
                     deps: TDeps): GeneratorObject | Promise<unknown> | Error {
      let preparedData = dataResolver(data, templateCfg, attrs, name);
      attrs = preparedData[2];
      const userData = preparedData[1];
      name = nameResolver(name);
      let res;
      const type = 'controller';
      if (Common.isCompat()) {
         res = timing.methodExecutionTime(this.createController, this, [name, userData, attrs, context, deps]);
         return checkResult.call(this, res, type, name);
      }
      res = this.createController(name, userData, attrs, context, deps);
      return checkResult.call(this, res, type, name);
   }

   prepareResolver(name: GeneratorTemplateOrigin,
                   data: IControlData,
                   attrs: IGeneratorAttrs,
                   templateCfg: ICreateControlTemplateCfg,
                   context: string,
                   deps: TDeps,
                   includedTemplates: TIncludedTemplate,
                   config: IGeneratorConfig,
                   contextObj?: GeneratorEmptyObject,
                   defCollection?: IGeneratorDefCollection | void): GeneratorObject | Promise<unknown> | Error {
      let preparedData = dataResolver(data, templateCfg, attrs, name);
      attrs = preparedData[2];
      const userData = preparedData[1];
      name = nameResolver(name);
      let res;
      const type = 'resolver';
      let handl, i;
      if (attrs.events) {
         for (i in attrs.events) {
            if (attrs.events.hasOwnProperty(i)) {
               for (handl = 0; handl < attrs.events[i].length; handl++) {
                  if (!attrs.events[i][handl].isControl) {
                     attrs.events[i][handl].toPartial = true;
                  }
               }
            }
         }
      }
      if (Common.isCompat()) {
         res = timing.methodExecutionTime(this.resolver, this, [name, userData, attrs, context, deps, includedTemplates, config, defCollection]);
         return checkResult.call(this, res, type, name);
      }
      res = this.resolver(name, userData, attrs, context, deps, includedTemplates, config, defCollection);
      return checkResult.call(this, res, type, name);

   }

   createControl(type: string,
                 name: GeneratorTemplateOrigin,
                 data: IControlData,
                 attrs: IGeneratorAttrs,
                 templateCfg: ICreateControlTemplateCfg,
                 context: string,
                 deps: TDeps,
                 includedTemplates: TIncludedTemplate,
                 config: IGeneratorConfig,
                 contextObj?: GeneratorEmptyObject,
                 defCollection?: IGeneratorDefCollection | void): GeneratorObject | Promise<unknown> | Error {
      let res;
      // TODO вынести конфиг ресолвер. пока это кранйе затруднительно, т.к. цепляет кучу всего.
      data = ConfigResolver.resolveControlCfg(data, templateCfg, attrs, calculateDataComponent(name));
      data.internal.logicParent = data.internal.logicParent || templateCfg.viewController;
      data.internal.parent = data.internal.parent || templateCfg.viewController;

      attrs.internal = data.internal;
      const userData = data.user;

      // Здесь можем получить null  в следствии !optional. Поэтому возвращаем ''
      if (name === null) {
         return this.createEmptyText();
      }
      // конвертирую объект строки в строку, чтобы везде провеять только на строку
      // объект вместо строки вероятно приходит из-за интернационализации
      if (name instanceof String) {
         name = name.toString();
      }

      // тип контрола - компонент с шаблоном
      if (type === 'wsControl') {
         if (Common.isCompat()) {
            res = timing.methodExecutionTime(this.createWsControl, this, [name, userData, attrs, context, deps]);
            return checkResult.call(this, res, type, name);
         }
         res = this.createWsControl(name, userData, attrs, context, deps);
         return checkResult.call(this, res, type, name);
      }
      // типа контрола - шаблон
      if (type === 'template') {
         if (Common.isCompat()) {
            res = timing.methodExecutionTime(this.createTemplate, this, [name, userData, attrs, context, deps, config]);
            return checkResult.call(this, res, type, name);
         }
         res = this.createTemplate(name, userData, attrs, context, deps, config);
         return checkResult.call(this, res, type, name);

      }
      // тип контрола - компонент без шаблона
      if (type === 'controller') {
         if (Common.isCompat()) {
            res = timing.methodExecutionTime(this.createController, this, [name, userData, attrs, context, deps]);
            return checkResult.call(this, res, type, name);
         }
         res = this.createController(name, userData, attrs, context, deps);
         return checkResult.call(this, res, type, name);

      }
      // когда тип вычисляемый, запускаем функцию вычисления типа и там обрабатываем тип
      if (type === 'resolver') {
         let handl, i;
         if (attrs.events) {
            for (i in attrs.events) {
               if (attrs.events.hasOwnProperty(i)) {
                  for (handl = 0; handl < attrs.events[i].length; handl++) {
                     if (!attrs.events[i][handl].isControl) {
                        attrs.events[i][handl].toPartial = true;
                     }
                  }
               }
            }
         }
         if (Common.isCompat()) {
            res = timing.methodExecutionTime(this.resolver, this, [name, userData, attrs, context, deps, includedTemplates, config, defCollection]);
            return checkResult.call(this, res, type, name);
         }
         res = this.resolver(name, userData, attrs, context, deps, includedTemplates, config, defCollection);
         return checkResult.call(this, res, type, name);
      }
   };

   prepareEvents(events) {
      Object.keys(events).forEach((eventName) => {
         const eventArr = events[eventName];
         eventArr.forEach((event) => {
            if (event.args) {
               event.fn = function (eventObj) {
                  const context = event.context.apply(this.viewController);
                  const handler = event.handler.apply(this.viewController);
                  if (typeof handler === 'undefined') {
                     throw new Error(`Отсутствует обработчик ${ event.value } события ${ eventObj.type } у контрола ${ event.viewController._moduleName }`);
                  }
                  const res = handler.apply(context, arguments);
                  if(res !== undefined) {
                     eventObj.result = res;
                  }
               };
            } else {
               event.fn = function (eventObj, value) {
                  if (!event.handler(this.viewController, value)) {
                     event.handler(this.data, value)
                  }
               };
            }

            event.fn = event.fn.bind({
               viewController: event.viewController,
               data: event.data
            });
            event.fn.control = event.viewController;
         });
      });
   }

   prepareDataForCreate(tplOrigin, scope, attrs, deps, includedTemplates?) {
      let controlClass;
      let dataComponent;
      let logicParent;
      let parent;

      // При использовании ts-модуля, где нужный класс экспортируется дефолтно, внутри js-модуля
      // сюда приходит объект tplOrigin, где __esModule есть true, а в default лежит нужная нам функция построения верстки
      // Для того, чтобы верстка строилась, необходимо вытащить функцию из default
      let tpl = typeof tplOrigin === 'object' && tplOrigin.__esModule && tplOrigin.default ? tplOrigin.default : tplOrigin;

      const resolverTpl = resolveTpl.call(this, tpl, deps, includedTemplates);
      controlClass = resolverTpl[0];
      dataComponent = resolverTpl[1];

      const fromOld = controlClass && controlClass.prototype && Common.isCompound(controlClass);

      let controlProperties = Scope.calculateScope(scope, Common.plainMerge) || {};

      if (fromOld) {
         for (let key in attrs.events) {
            controlProperties[key] = attrs.events[key];
         }
      } else {
         // @ts-ignore
         const prepareEvents = this.prepareEvents || this.generatorBase.prepareEvents;
         if (attrs.events) {
            prepareEvents(attrs.events);
         }
      }

      if (!attrs.attributes) {
         attrs.attributes = {};
      }
      if (this.prepareAttrsForPartial) {
         this.prepareAttrsForPartial(attrs.attributes);
      }
      if (controlClass === '_$inline_template') {
         // в случае ws:template отдаем текущие свойства
         return controlProperties;
      }

      logicParent = (attrs.internal && attrs.internal.logicParent) ? attrs.internal.logicParent : null;
      parent = (attrs.internal && attrs.internal.parent) ? attrs.internal.parent : null;
      OptionsResolver.resolveInheritOptions(controlClass, attrs, controlProperties);

      if (Common.isCompat()) {
         controlProperties = isCompatPatch(controlClass, controlProperties, attrs, fromOld);
      }

      return {
         logicParent: logicParent,
         parent: parent,
         attrs: attrs.attributes,
         controlProperties: controlProperties,
         dataComponent: dataComponent,
         internal: attrs.internal,
         controlClass: controlClass,
         compound: !(controlClass && controlClass.isWasaby)
      };
   };

   /**
    * Устанавливаем реальные реализации функций для генератора
    * @returns {object}
    * @param createEmptyText
    * @param createWsControl
    * @param createTemplate
    * @param createController
    * @param resolver
    * @param generatorContext
    */
   bindGeneratorFunction(createEmptyText: Function,
                         createWsControl: Function,
                         createTemplate: Function,
                         createController: Function,
                         resolver: Function,
                         generatorContext?: { cacheModules: TObject }): void {
      this.createEmptyText = createEmptyText;
      this.createWsControl = createWsControl;
      this.createTemplate = createTemplate;
      this.createController = createController;
      this.resolver = resolver;
      this.cacheModules = generatorContext.cacheModules;
   }
}
