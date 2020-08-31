/// <amd-module name="UI/_executor/_Markup/Generator" />
/* tslint:disable */

import { coreDebug as timing } from 'Env/Env';
import { Logger } from 'UI/Utils';
import * as Common from '../_Utils/Common';
import * as RequireHelper from '../_Utils/RequireHelper';
import * as OptionsResolver from '../_Utils/OptionsResolver';
import * as Scope from '../_Expressions/Scope';
import { _FocusAttrs } from 'UI/Focus';
import { EventUtils } from 'UI/Events';
import * as ConfigResolver from '../_Utils/ConfigResolver'
import {
   GeneratorEmptyObject,
   GeneratorObject,
   GeneratorTemplateOrigin, GeneratorVoid,
   IControl,
   IControlData,
   ICreateControlTemplateCfg,
   IGeneratorAttrs,
   IGeneratorConfig,
   IGeneratorDefCollection,
   TDeps,
   TIncludedTemplate,
   TObject,
   WsControlOrController,
   IControlUserData
} from 'UI/_executor/_Markup/IGeneratorType';

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

   chain(out: string, defCollection: IGeneratorDefCollection, inst?: IControl): Promise<string|void> | string | Error {
      function chainTrace(defObject: Array<any>): string {
         return out.replace(defRegExp, function(key) {
            const valKey = defCollection.id.indexOf(key);
            if (defObject[valKey] && defCollection.id[valKey]) {
               return defObject[valKey].result ? defObject[valKey].result : defObject[valKey];
            }
            if(defObject[valKey] === undefined) {
               Logger.asyncRenderErrorLog('Promise from chain return undefined value', inst);
            }
            return '';
         });
      }

      const Deferred = require('Core/Deferred');
      return Promise.all(defCollection.def).then(Deferred.skipLogExecutionTime(chainTrace), function(err) {
         Logger.asyncRenderErrorLog(err);
      });
   };

   prepareWsControl(name: GeneratorTemplateOrigin,
                    data: IControlData,
                    attrs: IGeneratorAttrs,
                    templateCfg: ICreateControlTemplateCfg,
                    context: string,
                    deps: TDeps): GeneratorObject | Promise<unknown> | Error {
      let preparedData = this.dataResolver(data, templateCfg, attrs, name);
      attrs = preparedData[2];
      const userData = preparedData[1];
      name = this.nameResolver(name);
      let res;
      const type = 'wsControl';
      if (Common.isCompat()) {
         res = timing.methodExecutionTime(this.createWsControl, this, [name, userData, attrs, context, deps]);
      } else {
         res = this.createWsControl(name, userData, attrs, context, deps);
      }
      return this.checkResult(res, type);
   }

   prepareTemplate(name: GeneratorTemplateOrigin,
                   data: IControlData,
                   attrs: IGeneratorAttrs,
                   templateCfg: ICreateControlTemplateCfg,
                   context: string,
                   deps: TDeps,
                   config: IGeneratorConfig): GeneratorObject | Promise<unknown> | Error {
      let preparedData = this.dataResolver(data, templateCfg, attrs, name);
      attrs = preparedData[2];
      const userData = preparedData[1];
      name = this.nameResolver(name);
      let res;
      const type = 'template';
      if (Common.isCompat()) {
         res = timing.methodExecutionTime(this.createTemplate, this, [name, userData, attrs, context, deps, config]);
      } else {
         res = this.createTemplate(name, userData, attrs, context, deps, config);
      }
      return this.checkResult(res, type);
   }

   prepareController(name: GeneratorTemplateOrigin,
                     data: IControlData,
                     attrs: IGeneratorAttrs,
                     templateCfg: ICreateControlTemplateCfg,
                     context: string,
                     deps: TDeps): GeneratorObject | Promise<unknown> | Error {
      let preparedData = this.dataResolver(data, templateCfg, attrs, name);
      attrs = preparedData[2];
      const userData = preparedData[1];
      name = this.nameResolver(name);
      let res;
      const type = 'controller';
      if (Common.isCompat()) {
         res = timing.methodExecutionTime(this.createController, this, [name, userData, attrs, context, deps]);
      } else {
         res = this.createController(name, userData, attrs, context, deps);
      }
      return this.checkResult(res, type);
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
      let preparedData = this.dataResolver(data, templateCfg, attrs, name);
      attrs = preparedData[2];
      const userData = preparedData[1];
      name = this.nameResolver(name);
      let res;
      const type = 'resolver';
      let handl, i;
      if (attrs.events) {
         for (i in attrs.events) {
            if (attrs.events.hasOwnProperty(i)) {
               for (handl = 0; handl < attrs.events[i].length; handl++) {
                  if (!attrs.events[i][handl].fn.isControlEvent) {
                     attrs.events[i][handl].toPartial = true;
                  }
               }
            }
         }
      }
      if (Common.isCompat()) {
         res = timing.methodExecutionTime(this.resolver, this, [name, userData, attrs, context, deps, includedTemplates, config, defCollection]);
      } else {
         res = this.resolver(name, userData, attrs, context, deps, includedTemplates, config, defCollection);
      }
      return this.checkResult(res, type);
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
   } else {
      // конвертирую объект строки в строку, чтобы везде провеять только на строку
      // объект вместо строки вероятно приходит из-за интернационализации
      if (name instanceof String) {
         name = name.toString();
      }

      // тип контрола - компонент с шаблоном
      if (type === 'wsControl') {
         if (Common.isCompat()) {
            res = timing.methodExecutionTime(this.createWsControl, this, [name, userData, attrs, context, deps]);
         } else {
            res = this.createWsControl(name, userData, attrs, context, deps);
         }
      }
      // типа контрола - шаблон
      if (type === 'template') {
         if (Common.isCompat()) {
            res = timing.methodExecutionTime(this.createTemplate, this, [name, userData, attrs, context, deps, config]);
         } else {
            res = this.createTemplate(name, userData, attrs, context, deps, config);
         }

      }
      // тип контрола - компонент без шаблона
      if (type === 'controller') {
         if (Common.isCompat()) {
            res = timing.methodExecutionTime(this.createController, this, [name, userData, attrs, context, deps]);
         } else {
            res = this.createController(name, userData, attrs, context, deps);
         }
      }
      // когда тип вычисляемый, запускаем функцию вычисления типа и там обрабатываем тип
      if (type === 'resolver') {
         let handl, i;
         if (attrs.events) {
            for (i in attrs.events) {
               if (attrs.events.hasOwnProperty(i)) {
                  for (handl = 0; handl < attrs.events[i].length; handl++) {
                     if (!attrs.events[i][handl].fn.isControlEvent) {
                        attrs.events[i][handl].toPartial = true;
                     }
                  }
               }
            }
         }
         if (Common.isCompat()) {
            res = timing.methodExecutionTime(this.resolver, this, [name, userData, attrs, context, deps, includedTemplates, config, defCollection]);
         } else {
            res = this.resolver(name, userData, attrs, context, deps, includedTemplates, config, defCollection);
         }
      }
      if (res !== undefined) {
         return res;
      } else {
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
   }
};

   prepareDataForCreate(tplOrigin, scope, attrs, deps, includedTemplates?) {
      let controlClass,
         logicParent,
         dataComponent,
         isSlashes,
         wasOptional,
         parent;
      // При использовании ts-модуля, где нужный класс экспортируется дефолтно, внутри js-модуля
      // сюда приходит объект tplOrigin, где __esModule есть true, а в default лежит нужная нам функция построения верстки
      // Для того, чтобы верстка строилась, необходимо вытащить функцию из default
      let tpl = typeof tplOrigin === 'object' && tplOrigin.__esModule && tplOrigin.default ? tplOrigin.default : tplOrigin;
      if (typeof tpl === 'function') {
         controlClass = tpl;
         dataComponent = tpl.prototype ? tpl.prototype._moduleName : '';
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

            if (tpl.indexOf('/') > -1) {
               isSlashes = true;
               if (tpl.indexOf('optional!') > -1) {
                  wasOptional = true;
               }
            }

            tpl = tpl.replace('optional!', '');
            if (includedTemplates && includedTemplates[tpl]) {
               controlClass = includedTemplates[tpl];
            }

            if (!controlClass) {
               controlClass = deps && (deps[tpl] || deps['optional!' + tpl]);
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
         }
      }
      if (typeof tpl === 'object' && tpl && tpl.library && tpl.module) {
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
         dataComponent = moduleName;
      }

      const fromOld = controlClass && controlClass.prototype && Common.isCompound(controlClass);

      const controlProperties = Scope.calculateScope(scope, Common.plainMerge) || {};
      if (fromOld) {
         for (let key in attrs.events) {
            controlProperties[key] = attrs.events[key];
         }
      }

      if (!attrs.attributes) {
         attrs.attributes = {};
      }
      _FocusAttrs.prepareAttrsForFocus(attrs.attributes, controlProperties);
      logicParent = (attrs.internal && attrs.internal.logicParent) ? attrs.internal.logicParent : null;
      parent = (attrs.internal && attrs.internal.parent) ? attrs.internal.parent : null;
      OptionsResolver.resolveInheritOptions(controlClass, attrs, controlProperties);


      if (Common.isCompat()) {
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
                         generatorContext?: {cacheModules: TObject}): void {
      this.createEmptyText = createEmptyText;
      this.createWsControl = createWsControl;
      this.createTemplate = createTemplate;
      this.createController = createController;
      this.resolver = resolver;
      this.cacheModules = generatorContext.cacheModules;
   }

   private dataResolver(data: IControlData,
                        templateCfg: ICreateControlTemplateCfg,
                        attrs: IGeneratorAttrs,
                        name:GeneratorTemplateOrigin): [IControlData, IControlUserData, IGeneratorAttrs] {
      data = ConfigResolver.resolveControlCfg(data, templateCfg, attrs, calculateDataComponent(name));
      data.internal.logicParent = data.internal.logicParent || templateCfg.viewController;
      data.internal.parent = data.internal.parent || templateCfg.viewController;

      attrs.internal = data.internal;
      const userData = data.user;
      return [data, userData, attrs];
   };

   private nameResolver(name: GeneratorTemplateOrigin): GeneratorTemplateOrigin {
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

   private checkResult(res: WsControlOrController | GeneratorVoid, type: string): WsControlOrController | GeneratorVoid {
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


}
