/// <amd-module name="UI/_executor/_Markup/Text/Generator" />
/* tslint:disable */

import { Builder } from '../Builder';
import * as Common from '../../_Utils/Common';
import * as RequireHelper from '../../_Utils/RequireHelper';
import * as Scope from '../../_Expressions/Scope';
import { Logger } from 'UI/Utils';
import { Generator } from '../Generator';
import { IGenerator } from '../IGenerator';
import { ResolveControlName } from '../ResolveControlName';
import {
   GeneratorEmptyObject,
   GeneratorObject,
   GeneratorTemplateOrigin,
   IControl,
   IControlData,
   IControlProperties,
   ICreateControlTemplateCfg,
   IGeneratorAttrs,
   IGeneratorConfig,
   IGeneratorDefCollection,
   IPrepareDataForCreate,
   TDeps,
   TIncludedTemplate,
   TObject
} from '../IGeneratorType';
import { createTagDefault, joinElements, stringTemplateResolver } from '../Utils'

const markupBuilder = new Builder();

/**
 * @author Тэн В.А.
 */
export class GeneratorText implements IGenerator {
   cacheModules: TObject;
   generatorBase: Generator;

   constructor() {
      this.cacheModules = {};
      this.generatorBase = new Generator();
      this.generatorBase.bindGeneratorFunction(this.createEmptyText, this.createWsControl, this.createTemplate,
         this.createController, this.resolver, this)
   }

   /**
    * Обрабатывает сырые данные, приводя их однородному виду
    * @param tplOrigin
    * @param scope
    * @param attrs
    * @param deps
    * @param includedTemplates
    * @returns {object}
    */
   private prepareDataForCreate(tplOrigin: GeneratorTemplateOrigin,
                                scope: IControlProperties,
                                attrs: IGeneratorAttrs,
                                deps: TDeps,
                                includedTemplates?: TIncludedTemplate): IPrepareDataForCreate {
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
      let data = this.prepareDataForCreate(tpl, scope, attributes, _deps);

      let dataComponent = data.dataComponent;

      Logger.debug(`createWsControl - "${data.dataComponent}"`, data.controlProperties);
      Logger.debug('Context for control', attributes.context);
      Logger.debug('Inherit options for control', attributes.inheritOptions);

      const cnstr = data.controlClass;
      let resultingFn = cnstr && cnstr.prototype && cnstr.prototype._template;

      if (!cnstr && !resultingFn) {
         let message = `Попытка создания контрола ${data.dataComponent}, у которого отсутствует конструктор и шаблон`;
         let e = new Error(`Ошибка создания контрола (${data.dataComponent}) - конструктор не найден`);
         // TODO в аргументах функции createWsControl содержатся много вспомогательной информации, нужно изучить что можно передать в детализацию логера за место инстанса
         Logger.error(message, data.logicParent, e);
         this.createEmptyText();
      }

      if (cnstr && !resultingFn) {
         return this.createController(cnstr, scope, attributes, context, _deps);
      }

      var _options = data.controlProperties;
      if (!_options['data-component']) {
         _options['data-component'] = dataComponent;
      }
      /**
       * Опции для dirtyChecking будем прокидывать только в VDOM
       */
      for (let di = 0; _options.hasOwnProperty("__dirtyCheckingVars_" + di); di++) {
         delete _options["__dirtyCheckingVars_" + di];
      }
      let decOptions = ResolveControlName.resolveControlName(_options, attributes);
      return markupBuilder.buildForNewControl({
         user: _options,
         internal: data.internal,
         templateContext: attributes.context,
         inheritOptions: attributes.inheritOptions,
         key: attributes.key
      }, cnstr, decOptions);
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
      var data = this.prepareDataForCreate(name, scope, attributes, _deps);

      var parent = data.parent;
      var resolvedScope = data.controlProperties;

      const componentName = Common.isString(name) ? name : 'InlineFunction';
      Logger.debug(`createWsControl - "${componentName}"`, data.controlProperties);
      Logger.debug('Context for control', attributes.context);
      Logger.debug('Inherit options for control', attributes.inheritOptions);

      // Здесь можем получить null  в следствии !optional. Поэтому возвращаем ''
      return resultingFn === null ? '' : (parent ? resultingFn.call(parent, resolvedScope, attributes, context) : resultingFn(resolvedScope, attributes, context));
   }

   createController(cnstr, scope, attributes, context, _deps?) {
      /**
       * В VDom идеологии контроллер - это пустая текстовая нода. И она имеет смысл только в VDom
       * Получается, для экономии ресурсов нам не надо вызвать конструктор компонента здесь,
       * ведь результат все равно никак не сохранить
       * Нужно ли здесь вызывать beforeMount? Такой задачи не известно, ведь обращаться к данным,
       * которые может вернуть контрол в beforeMount может только он сам.
       * А если он не визуальный, зачем тогда ему какие-то данные проксировать через текстовый вид?
       */
      return this.createEmptyText();
   };

   resolver(tpl, preparedScope, decorAttribs, context, _deps?, includedTemplates?, config?, defCollection?) {
      if (typeof tpl === 'undefined') {
         const typeTemplate = typeof tpl;
         Logger.error(`${typeTemplate} component error - Попытка использовать компонент/шаблон, ` +
            `но вместо компонента в шаблоне был передан ${typeTemplate}! ` +
            'Если верстка строится неправильно, нужно поставить точку останова и исследовать стек вызовов. ' +
            `По стеку будет понятно, в каком шаблоне и в какую опцию передается ${typeTemplate}`, tpl);
         return this.createEmptyText();
      }
      let isTplString = typeof tpl === 'string';
      let isTplModule = Common.isLibraryModule(tpl);
      let isTemplateWrapper = false;
      let data = this.prepareDataForCreate(tpl, preparedScope, decorAttribs, _deps, includedTemplates);
      let resolvedScope = data.controlProperties;
      let fn;

      if (isTplString) {
         fn = stringTemplateResolver(tpl, includedTemplates, _deps, config, data.parent);
      } else if (isTplModule) {
         fn = data.controlClass;
      } else {
         fn = tpl;
      }

      // FIXME: Для OnlineSbisRu/CompatibleTemplate необходимо использовать default export,
      // временно добавили проверку на этот модуль, проверять по _moduleName опасно,
      // т.к. в режиме резиза может работаь не верно, поэтому проверим на наличии дополнительного экспорта
      if (fn && fn.hasOwnProperty('TemplateWrapper') && fn.hasOwnProperty('HeadContent') && fn.hasOwnProperty('default')) {
         isTemplateWrapper = true;
         fn = fn.default;
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
         if (fn.prototype._template) {
            return this.createWsControl(fn, preparedScope, decorAttribs, context, _deps);
         }
      } else {
         const componentName = isTplString ? tpl : 'InlineFunction';
         Logger.debug(`createWsControl - "${componentName}"`, data.controlProperties);
         Logger.debug('Context for control', decorAttribs.context);
         Logger.debug('Inherit options for control', decorAttribs.inheritOptions);

         let r;
         let callContext = preparedScope && data.parent ? data.parent : fn;
         if (!this.isValidTemplate(fn, tpl, isTplString, isTplModule, isTemplateWrapper)) {
            return this.createEmptyText();
         }
         if (typeof fn === 'function') {
            r = fn.call(callContext, resolvedScope, decorAttribs, context, false);
         } else if (fn && typeof fn.func === 'function') {
            r = fn.func.call(callContext, resolvedScope, decorAttribs, context, false);
         } else if (Common.isArray(fn)) {
            const _this = this;
            r = fn.map(function (template) {
               if (!_this.isValidTemplate(template, tpl, isTplString, isTplModule, isTemplateWrapper)) {
                  return _this.createEmptyText();
               }
               callContext = preparedScope && data.parent ? data.parent : template;
               if (typeof template === 'function') {
                  return template.call(callContext, resolvedScope, decorAttribs, context, false);
               } else if (typeof template.func === 'function') {
                  return template.func.call(callContext, resolvedScope, decorAttribs, context, false);
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
            this.createEmptyText();
         } else {
            r = tpl;
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

   /**
    * Создает ноду-комментарий
    * @param text
    * @returns {string}
    */
   createComment(text) {
      return '<!--' + text + '-->';
   };

   /**
    * Вычисляет скоп
    * @param scope
    * @returns {object}
    */
   calculateScope(scope) {
      return Scope.calculateScope(scope, Scope.controlPropMerge);
   };

   private isValidTemplate(fn: any,
                           tpl: GeneratorTemplateOrigin,
                           isTplString: boolean,
                           isTplModule: boolean,
                           isTemplateWrapper: boolean): boolean {
      let reason = '';
      let isValid = true;
      if (isTplString && typeof fn === 'number') {
         isValid = false;
         reason = `В качестве компонента/шаблона было передано число.`
      }
      if (isTplModule && typeof fn === 'string') {
         isValid = false;
         reason = `Из библиотеки ${tpl} в качестве компонента была передана строка.`
      }
      if (typeof fn === 'object' && !isTemplateWrapper && !fn.hasOwnProperty('func') && !Common.isArray(fn)) {
         isValid = false;
         if (fn.hasOwnProperty('default')) {
            reason = 'В модуле экспортируется объект по-умолчанию (export default ControlName).'
         }
      }
      if (isValid) {
         Logger.error(`Не удалось построить верстку.` +
            `В качестве шаблона контрола ${tpl} была передана структура не поддерживаемая генератором.` +
            `${reason}`, fn);
      }
      return isValid;
   }
}
