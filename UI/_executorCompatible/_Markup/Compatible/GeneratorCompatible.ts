/// <amd-module name="UI/_executorCompatible/_Markup/Compatible/GeneratorCompatible" />
/* tslint:disable */

import { Generator } from 'UI/_executor/_Markup/Generator';
import { CompatibleControlBuilder } from './CompatibleControlBuilder';
import { IGenerator } from 'UI/_executor/_Markup/IGenerator';
import { Logger } from 'UI/Utils';
import * as Common from 'UI/_executor/_Utils/Common';
import * as RequireHelper from 'UI/_executor/_Utils/RequireHelper';
import {
   resultingFnAction,
   notOptionalControlCompatible,
   fixTabindexUsingAttributeCompatible,
   notModuleStringCompatible,
   tabIndexRemoveCompatible
} from './Helper';
// @ts-ignore
import * as shallowClone from 'Core/helpers/Function/shallowClone';
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
   TIncludedTemplate, TObject
} from 'UI/_executor/_Markup/IGeneratorType';
import { stringTemplateResolver, joinElements, createTagDefault } from 'UI/_executor/_Markup/Utils';
import * as Scope from 'UI/_executor/_Expressions/Scope';

const markupBuilder = new CompatibleControlBuilder();

/**
 * @author Тэн В.А.
 */
export class GeneratorCompatible implements IGenerator {
   // Повышаем производиительность путем дублирования кода для совместимости
   // Проверка условий в оригинальном методе замедляет выполнение на ~60% https://jsperf.com/if-compat-speed
   // TODO: удалить после отказа от слоя совместимости
   cacheModules: TObject;
   generatorBase: Generator;

   constructor() {
      this.cacheModules = {};
      this.generatorBase = new Generator();
      this.generatorBase.bindGeneratorFunction(this.createEmptyText, this.createWsControl, this.createTemplate,
         this.createController, this.resolver, this)
   }

   private prepareDataForCreate(tplOrigin, scope, attrs, deps, includedTemplates?) {
      return this.generatorBase.prepareDataForCreate.call(this, tplOrigin, scope, attrs, deps, includedTemplates);
   }

   chain(out: string, defCollection: IGeneratorDefCollection, inst?: IControl): Promise<string|void> | string | Error {
      return this.generatorBase.chain.call(this, out, defCollection, inst);
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
      return this.generatorBase.createControl.call(this, type, name, data, attrs, templateCfg, context, deps, includedTemplates,
         config, contextObj, defCollection);
   }

   createText(text) {
      return text;
   };

   createWsControl(tpl, scope, attributes, context, _deps?) {
      var data = this.prepareDataForCreate(tpl, scope, attributes, _deps);

      var dataComponent = data.dataComponent;

      Logger.debug(`createWsControl - "${data.dataComponent}"`, data.controlProperties);
      Logger.debug('Context for control', attributes.context);
      Logger.debug('Inherit options for control', attributes.inheritOptions);

      var id,
         varStorage = null,
         cnstr = data.controlClass,
         resultingFn = resultingFnAction(cnstr),
         decOptions;

      if (!cnstr && !resultingFn) {
         var message = 'Попытка создания контрола, у которого отсутствует конструктор и шаблон';
         var e = new Error('createWsControl() - constructor not found');
         // TODO в аргументах функции createWsControl содержатся много вспомогательной информации,
         //  нужно изучить что можно передать в детализацию логера за место инстанса
         if (notOptionalControlCompatible(tpl)) {
            Logger.error(message, data, e);
         }
         return '';
      }

      if (cnstr && !resultingFn) {
         if (!Common.isNewControl(cnstr)) {
            fixTabindexUsingAttributeCompatible(attributes.attributes, scope);
         }
         return this.createController(cnstr, scope, attributes, context, _deps);
      }

      var _options = data.controlProperties;
      if (!_options['data-component']) {
         _options['data-component'] = dataComponent;
      }

      if (!data.logicParent || !data.logicParent._template || !Common.isNewControl(cnstr)) {
         _options = shallowClone(_options);
      }

      /**
       * Опции для dirtyChecking будем прокидывать только в VDOM
       */
      for (let di = 0; _options.hasOwnProperty("__dirtyCheckingVars_" + di); di++) {
         delete _options["__dirtyCheckingVars_" + di];
      }
      return markupBuilder.buildWsControlCompatible(_options, scope, cnstr, data, id, resultingFn, decOptions, dataComponent, attributes, context, varStorage);
   };

   createTemplate(name, scope, attributes, context, _deps?, config?) {
      var resultingFn,
         resolver = Common.hasResolver(name, config && config.resolvers);
      if (Common.isString(name)) {
         if (resolver) {
            resultingFn = config.resolvers[resolver](name);
         } else {
            // @ts-ignore
            resultingFn = _deps && (_deps[name] && _deps[name].default || _deps[name]) || RequireHelper.require(name);
            if (resultingFn && Common.isOptionalString(name) && !Common.isTemplateString(name)) {
               return this.createWsControl(name.split('js!')[1], scope, attributes, context, _deps);
            }
         }
      } else {
         resultingFn = name;
      }
      tabIndexRemoveCompatible(scope);
      var data = this.prepareDataForCreate(name, scope, attributes, _deps);

      var parent = data.parent;
      var resolvedScope = data.controlProperties;

      const componentName = Common.isString(name) ? name : 'InlineFunction';
      Logger.debug(`createWsControl - "${componentName}"`, data.controlProperties);
      Logger.debug('Context for control', attributes.context);
      Logger.debug('Inherit options for control', attributes.inheritOptions);

      // Здесь можем получить null  в следствии !optional. Поэтому возвращаем ''
      return resultingFn === null ? '' : (parent ? resultingFn.call(parent, resolvedScope, attributes, context) : resultingFn(resolvedScope, attributes, context));
   };

   createController(cnstr, scope, attributes, context, _deps?) {
      const data = this.prepareDataForCreate(cnstr, scope, attributes, _deps);
      return markupBuilder.createCompatibleController(cnstr, scope, attributes, context, _deps, data);
   };

   resolver(tpl, preparedScope, decorAttribs, context, _deps?, includedTemplates?, config?, defCollection?) {
      var
         isTplString = typeof tpl === 'string',
         isTplModule = Common.isLibraryModule(tpl),
         data = this.prepareDataForCreate(tpl, preparedScope, decorAttribs, _deps, includedTemplates),
         resolvedScope = data.controlProperties,
         fn;

      if (isTplString) {
         fn = stringTemplateResolver(tpl, includedTemplates, _deps, config);
      } else if (isTplModule) {
         fn = data.controlClass;
      } else {
         fn = tpl;
      }

      if (Common.isControlClass(fn)) {
         /**
          * Сейчас оживление контролов построено на атрибуте data-component
          * и если вдруг мы туда запишем неправильный moduleName то все упадет
          * Контрол будет создан не от того класса, поэтому для решения проблем такой
          * совместимости пропатчим _moduleName правильным значением
          */
         if (isTplString && tpl.indexOf('js!') !== -1 && !RequireHelper.defined(fn.prototype._moduleName)) {
            fn.prototype._moduleName = tpl.split('js!')[1];
         }
         if (fn.prototype._dotTplFn || fn.prototype._template) {
            return this.createWsControl(fn, resolvedScope, decorAttribs, context, _deps);
         } else {
            return markupBuilder.createCompatibleController(fn, resolvedScope, decorAttribs, context, _deps, data);
         }

      } else {
         const componentName = isTplString ? tpl : 'InlineFunction';
         Logger.debug(`createWsControl - "${componentName}"`, data.controlProperties);
         Logger.debug('Context for control', decorAttribs.context);
         Logger.debug('Inherit options for control', decorAttribs.inheritOptions);

         var r;
         if (typeof fn === 'function') {
            r = preparedScope && data.parent ? fn.call(data.parent, resolvedScope, decorAttribs, context, false) :
               fn(resolvedScope, decorAttribs, context, false);
         } else if (fn && typeof fn.func === 'function') {
            r = preparedScope && data.parent ? fn.func.call(data.parent, resolvedScope, decorAttribs, context, false) :
               fn.func(resolvedScope, decorAttribs, context, false);
         } else if (Common.isArray(fn)) {
            r = preparedScope && data.parent ?
               fn.map(function (template) {
                  if (typeof template === 'function') {
                     return template.call(data.parent, resolvedScope, decorAttribs, context, false);
                  } else if (typeof template.func === 'function') {
                     return template.func.call(data.parent, resolvedScope, decorAttribs, context, false);
                  }
                  return template;
               })
               :
               fn.map(function (template) {
                  if (typeof template === 'function') {
                     return template(resolvedScope, decorAttribs, context, false);
                  } else if (typeof template.func === 'function') {
                     return template.func(resolvedScope, decorAttribs, context, false);
                  }
                  return template;
               });
            r = this.joinElements(r, undefined, defCollection);
         } else if (typeof tpl === 'undefined') {
            const typeTemplate = typeof tpl;
            Logger.error(`${typeTemplate} component error - Попытка использовать компонент/шаблон, ` +
               `но вместо компонента в шаблоне был передан ${typeTemplate}! ` +
               'Если верстка строится неправильно, нужно поставить точку останова и исследовать стек вызовов. ' +
               `По стеку будет понятно, в каком шаблоне и в какую опцию передается ${typeTemplate}`, fn);
            return this.createEmptyText();
         } else {
            return notModuleStringCompatible(tpl, isTplString, resolvedScope, decorAttribs, context);
         }
         return r;
      }
   };

   joinElements(elements, key?, defCollection?) {
      return joinElements(elements, key, defCollection);
   };

   createTag(tag, attrs, children, attrToDecorate?, defCollection?): string {
      return createTagDefault(tag, attrs, children, attrToDecorate, defCollection);
   }

   createEmptyText(){
      return '';
   };

   getScope(data) {
      return data;
   };

   escape(value) {
      return Common.escape(value);
   };

   createDirective(text) {
      return '<' + text + '>';
   };

   createComment(text) {
      return '<!--' + text + '-->';
   };

   calculateScope(scope) {
      return Scope.calculateScope(scope, Scope.controlPropMerge);
   };

}
