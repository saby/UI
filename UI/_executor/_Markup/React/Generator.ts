import * as react from 'browser!react';
import type { Component } from 'react';
import { ArrayUtils } from 'UI/Utils';
import { Logger } from 'UI/Utils';
import { _FocusAttrs } from 'UI/Focus';
import * as Attr from '../../_Expressions/Attr';
import * as Common from '../../_Utils/Common';
import * as RequireHelper from '../../_Utils/RequireHelper';
import { invisibleNodeTagName } from '../../Utils';
import { onElementMount, onElementUnmount } from '../../_Utils/ChildrenManager';
import { Generator } from '../Generator';
import { IGenerator } from '../IGenerator';
import {
   GeneratorEmptyObject,
   GeneratorError,
   GeneratorFn,
   GeneratorObject,
   GeneratorStringArray,
   GeneratorTemplateOrigin,
   GeneratorVoid,
   IBaseAttrs,
   IControl,
   IControlData,
   IControlProperties,
   ICreateControlTemplateCfg,
   IGeneratorAttrs,
   IGeneratorConfig,
   IGeneratorDefCollection,
   IPrepareDataForCreate,
   TAttributes,
   TDeps,
   TIncludedTemplate,
   ITemplateNode,
   TObject,
   TScope, IControlConfig
} from '../IGeneratorType';
import { GeneratorNode } from '../Vdom/IVdomType';
import { cutFocusAttributes } from '../Utils';
import { VNode } from 'Inferno/third-party/index';
import {ResolveControlName} from "../ResolveControlName";
import {Builder} from "../Builder";
import {repairEventName} from './eventMap';
import {convertAttributes} from './Attributes';
import {voidElementTags} from './VoidElementTags';
import { WasabyContextManager } from 'UI/_react/WasabyContext/WasabyContextManager';
const markupBuilder = new Builder();

/**
 * @author Тэн В.А.
 */
export class GeneratorReact implements IGenerator {
   cacheModules: TObject;
   canBeCompatible: boolean;
   generatorBase: Generator;

   private generatorConfig: IGeneratorConfig;

   constructor(config: IGeneratorConfig) {
      if (config) {
         this.generatorConfig = config;
      }
      this.cacheModules = {};
      this.generatorBase = new Generator(config);
      this.canBeCompatible = false;
      this.generatorBase.bindGeneratorFunction(this.createEmptyText, this.createWsControl,
         this.createTemplate, this.createController, this.resolver, this);
   }

   createControlNew(
      type: string,
      method: Function,
      attributes: Record<string, unknown>,
      events: Record<string, unknown>,
      options: Record<string, unknown>,
      config: IControlConfig
   ): GeneratorObject | Promise<unknown> | Error {
      return this.generatorBase.createControlNew.call(this, type, method, attributes, events, options, config);
   }

   chain(out: string,
         defCollection: IGeneratorDefCollection,
         inst?: IControl): Promise<string | void> | string | Error {
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
      return this.generatorBase.createControl.call(this, type, name, data, attrs, templateCfg, context,
         deps, includedTemplates, config, contextObj, defCollection);
   }

   private prepareDataForCreate(tplOrigin: GeneratorTemplateOrigin,
                                scope: IControlProperties,
                                attrs: IGeneratorAttrs,
                                deps: TDeps,
                                includedTemplates?: TIncludedTemplate): IPrepareDataForCreate {
      return this.generatorBase.prepareDataForCreate(tplOrigin, scope, attrs, deps, includedTemplates);
   }

   prepareWsControl(name: GeneratorTemplateOrigin,
                    data: IControlData,
                    attrs: IGeneratorAttrs,
                    templateCfg: ICreateControlTemplateCfg,
                    context: string,
                    deps: TDeps): GeneratorObject | Promise<unknown> | Error {
      return this.generatorBase.prepareWsControl(name, data, attrs, templateCfg, context, deps);
   }

   prepareTemplate(name: GeneratorTemplateOrigin,
                   data: IControlData,
                   attrs: IGeneratorAttrs,
                   templateCfg: ICreateControlTemplateCfg,
                   context: string,
                   deps: TDeps,
                   config: IGeneratorConfig): GeneratorObject | Promise<unknown> | Error {
      return this.generatorBase.prepareTemplate(name, data, attrs, templateCfg, context, deps, config);
   }

   prepareController(name: GeneratorTemplateOrigin,
                     data: IControlData,
                     attrs: IGeneratorAttrs,
                     templateCfg: ICreateControlTemplateCfg,
                     context: string,
                     deps: TDeps): GeneratorObject | Promise<unknown> | Error {
      return this.generatorBase.prepareController(name, data, attrs, templateCfg, context, deps);
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
      return this.generatorBase.prepareResolver(name,
         data,
         attrs,
         templateCfg,
         context,
         deps,
         includedTemplates,
         config,
         contextObj,
         defCollection);
   }

   createText(text: string, key: string): VNode {
      if (!text) {
         return '';
      }
      //here
      return text;
   }

   createWsControl(name: GeneratorTemplateOrigin,
                   scope: IControlProperties,
                   attrs: IGeneratorAttrs,
                   _: string,
                   deps?: TDeps,
                   preparedData?: IPrepareDataForCreate): GeneratorNode | GeneratorVoid {
      const data = preparedData || this.prepareDataForCreate(name, scope, attrs, deps);
      const controlClass = data.controlClass;

      Logger.debug(`createWsControl - "${data.dataComponent}"`, data.controlProperties);
      Logger.debug('Context for control', attrs.context);
      Logger.debug('Inherit options for control', attrs.inheritOptions);

      if (!controlClass) {
         return this.createText('', data.controlProperties && data.controlProperties.__key || attrs.key);
      }

      //here
      let decOptions = ResolveControlName.resolveControlName(data.controlProperties, <any>attrs);
      return markupBuilder.buildForNewControl({
         user: data.controlProperties,
         events: attrs.events,
         internal: data.internal,
         templateContext: attrs.context,
         inheritOptions: attrs.inheritOptions,
         key: data.controlProperties.__key || attrs.key
      }, controlClass, decOptions);
   }

   createTemplate(
      name: string,
      scope: IControlProperties,
      attributes: IGeneratorAttrs,
      context: string,
      _deps?: TDeps): string | ITemplateNode | GeneratorNode {
      let resultingFn;
      if (Common.isString(name)) {
         // @ts-ignore
         resultingFn = _deps && (_deps[name] && _deps[name].default || _deps[name]) || RequireHelper.require(name);
         if (resultingFn && Common.isOptionalString(name) && !Common.isTemplateString(name)) {
            return this.createWsControl(name.split('js!')[1], scope, attributes, context, _deps);
         }
      } else {
         resultingFn = name;
      }

      const data = this.prepareDataForCreate(name, scope, attributes, _deps);
      /*
      Контролы берут наследуемые опции из контекста.
      Шаблоны так не могут, потому что они не полноценные реактовские компоненты.
      Поэтому берём значения либо из опций, либо из родителя.
       */
      // FIXME: тип для data тянется из старого генератора, который ничего не знает про реакт
      if (typeof data.controlProperties.readOnly === 'undefined') {
         data.controlProperties.readOnly =
            (data.parent as unknown as Component<{ readOnly: boolean }>).props.readOnly ??
            (data.parent as unknown as Component).context.readOnly;
      }
      if (typeof data.controlProperties.theme === 'undefined') {
         data.controlProperties.theme =
            (data.parent as unknown as Component<{ theme: 'string' }>).props.theme ??
            (data.parent as unknown as Component).context.theme;
      }

      // Здесь можем получить null  в следствии !optional. Поэтому возвращаем ''
      if (resultingFn == null) {
         // @ts-ignore
         return '';
      }

      // Если мы имеем подшаблоны только для красоты,
      // а не для DirtyChecking тогда мы хотим увеличивать один и тот же итератор
      // в разных шаблонах, а значит они не должны разрываться DirtyChecking'ом
      if (data.controlProperties.__noDirtyChecking) {
         return this.resolver(resultingFn, data.controlProperties, attributes, context, _deps);
      }

      //here
      const obj = {
         compound: false,
         template: resultingFn,
         controlProperties: data.controlProperties,
         parentControl: data.parent,
         attributes,
         context: attributes.key,
         type: 'TemplateNode',
         // Template nodes must participate in reorder DirtyChecking.ts function same as
         // controlNodes do
         key: (data.controlProperties && data.controlProperties.key) || attributes.key,
         flags: 262144
      };

      Object.defineProperty(obj, 'count', {
         configurable: true,
         get(): number {
            let descendants = 0;
            if (this.children) {
               for (let i = 0; i < this.children.length; i++) {
                  const child = this.children[i];
                  descendants += child.count || 0;
               }
               return this.children.length + descendants;
            } else {
               return 0;
            }
         }
      });
      return react.createElement(
         WasabyContextManager, {
            readOnly: obj.controlProperties.readOnly,
            theme: obj.controlProperties.theme
         },
         obj.template.call(
            obj.parentControl,
            obj.controlProperties,
            obj.attributes,
            obj.context,
            true,
            undefined,
            undefined,
            this.generatorConfig
         )
      );
   }

   createController(name: string,
                    scope: IControlProperties,
                    attributes: TAttributes,
                    context: string,
                    _deps?: TDeps): string {
      return this.createWsControl.apply(this, arguments);
   }

   resolver(
      tpl: GeneratorTemplateOrigin,
      preparedScope: IControlProperties,
      decorAttribs: IGeneratorAttrs,
      context: string,
      _deps?: TDeps,
      includedTemplates?: TIncludedTemplate,
      config?: IGeneratorConfig,
      defCollection?: IGeneratorDefCollection
   ): GeneratorStringArray | GeneratorFn {
      const data = this.prepareDataForCreate(tpl, preparedScope, decorAttribs, _deps, includedTemplates);
      const resolvedScope = data.controlProperties;
      const isTplString = typeof tpl === 'string';
      let fn;

      if (isTplString) {
         fn = Common.depsTemplateResolver(tpl, includedTemplates, _deps, config);
      } else {
         fn = data.controlClass;
      }

      if (!fn) {
         if (typeof tpl === 'function') {
            fn = tpl;
            // @ts-ignore
         } else if (tpl && typeof tpl.func === 'function') {
            fn = tpl;
         } else if (Common.isArray(tpl)) {
            fn = tpl;
         }
      }

      if (Common.isControlClass(fn)) {
         return this.createWsControl(fn, resolvedScope, decorAttribs, context, _deps, data) as GeneratorNode;
      }

      if (Common.isTemplateClass(fn)) {
         return this.createTemplate(fn, resolvedScope, decorAttribs, context, _deps);
      }

      const nameFunc = isTplString ? tpl : 'InlineFunction';
      Logger.debug(`createWsControl - "${nameFunc}"`, data.controlProperties);
      Logger.debug('Context for control', decorAttribs.context);
      Logger.debug('Inherit options for control', decorAttribs.inheritOptions);

      const parent = data.parent;
      if (typeof fn === 'function') {
         if (Common.isAnonymousFn(fn)) {
            this.anonymousFnError(fn, parent);
            return this.createText('', decorAttribs.key);
         }
         return parent ?
            fn.call(parent, resolvedScope, decorAttribs, context, true, undefined, undefined, this.generatorConfig) :
            fn(resolvedScope, decorAttribs, context, true);
      }
      if (fn && typeof fn.func === 'function') {
         if (Common.isAnonymousFn(fn.func)) {
            this.anonymousFnError(fn.func, parent);
            return this.createText('', decorAttribs.key);
         }
         return parent ?
            fn.func.call(parent, resolvedScope, decorAttribs, context, true, undefined, undefined, this.generatorConfig) :
            fn.func(resolvedScope, decorAttribs, context, true);
      }
      if (Common.isArray(fn)) {
         return this.resolveTemplateArray(parent, fn, resolvedScope, decorAttribs, context);
      }
      if (typeof tpl === 'undefined') {
         const typeTpl = typeof tpl;
         Logger.error(`${typeTpl} component error - Попытка использовать компонент/шаблон, ` +
            `но вместо компонента в шаблоне был передан ${typeTpl}! ` +
            'Если верстка строится неправильно, нужно поставить точку останова и исследовать стек вызовов. ' +
            `По стеку будет понятно, в каком шаблоне и в какую опцию передается ${typeTpl}`, parent);
         return this.createText('', decorAttribs.key);
      }
      if (fn === false) {
         Logger.error(`Контрол ${tpl} отсутствует в зависимостях и не может быть построен."`, parent);
         return this.createText('', decorAttribs.key);
      }
      // create text node, if template is some text
      if (typeof tpl !== 'string') {
         Logger.error(
            `Template error - Invalid value of ws:partial template option: ${tpl} typeof ` + typeof tpl,
            parent
         );
      }
      if (Common.isCompat()) {
         return this.createText('' + tpl, decorAttribs.key);
      }
      // TODO: разобраться с правильным использованием ws:partial
      // отключены предупреждения по задаче
      // https://online.sbis.ru/opendoc.html?guid=04ddc7d0-396a-473b-9a65-ee1ddc6a7243
      // в целом использование ws:partial сейчас не правильное
      // https://online.sbis.ru/obj/Meeting/b3e2f39d-1a41-4acd-a8d7-44f4cfc03112
      // задача https://online.sbis.ru/opendoc.html?guid=f5c07778-2769-414b-afa8-30ad6193770a
      // const message = `Template warning -  "${tpl}"!` +
      //    'Options "template" must be control or template not a string';
      // Logger.warn(message, data.logicParent);
      return this.createText('' + tpl, decorAttribs.key);
   }

   joinElements(elements: GeneratorStringArray): GeneratorStringArray | GeneratorError {
      if (Array.isArray(elements)) {
         /* Partial может вернуть массив, в результате чего могут появиться вложенные массивы.
          Поэтому здесь необходимо выпрямить массив elements */
         elements = ArrayUtils.flatten(elements, true);
         return elements;
      } else {
         throw new Error('joinElements: elements is not array');
      }
   }

   createTag(
      tagName: string,
      attrs: IBaseAttrs,
      children: GeneratorStringArray,
      attrToDecorate: TAttributes,
      defCollection: IGeneratorDefCollection,
      control: any
   ): any {
      if (tagName === invisibleNodeTagName) {
         //here
         return null;
      }

      if (!attrToDecorate) {
         attrToDecorate = {};
      }
      if (!attrs) {
         attrs = {attributes: {}, events: {}, key: ''};
      }

      if (attrs.events) {
         this.generatorBase.prepareEvents(attrs.events);
      }

      const mergedAttrs = Attr.mergeAttrs(attrToDecorate.attributes, attrs.attributes);
      const mergedEvents = Attr.mergeEvents(attrToDecorate.events, attrs.events);

      _FocusAttrs.prepareTabindex(mergedAttrs);

      Object.keys(mergedAttrs).forEach((attrName) => {
         if (attrName.indexOf('top:') === 0) {
            const newAttrName = attrName.replace('top:', '');
            mergedAttrs[newAttrName] = mergedAttrs[newAttrName] || mergedAttrs[attrName];
            delete mergedAttrs[attrName];
         }
      });

      // Убрать внутри обработку event
      const props = {
         attributes: mergedAttrs,
         hooks: {},
         events: mergedEvents || {}
      };
      const isKeyAttr = props.attributes && props.attributes.key;
      const key = isKeyAttr ? props.attributes.key : attrs.key;

      // выпрямляем массив детей, чтобы не было вложенных массивов (они образуются из-за for)
      children = ArrayUtils.flatten(children, true);
      // в случае void тегов не должно быть детей, иначе реакт ругается
      if (voidElementTags[tagName]) {
         children = null;
      }

      //here
      const ref = function(node: any): any {
         const attrs = props.attributes;
         if (node) {
            if (Common.isControl(control) && attrs && attrs.name) {
               control._children[attrs.name] = node;
               onElementMount(control._children[attrs.name]);
            }
            if (attrs) {
               cutFocusAttributes(attrs, (attrName: any, attrValue: any): void => {
                  node[attrName] = attrValue;
               }, node);
            }
         } else {
            if (control && !control._destroyed && attrs && attrs.name) {
               onElementUnmount(control._children, attrs.name);
            }
         }
      };

      const convertedEvents = {};
      Object.keys(mergedEvents).forEach((eventName) => {
         const eventObjects = mergedEvents[eventName];
         eventObjects.forEach((eventObject) => {
            let finalArgs = [];

            /* Составляем массив аргументов для обаботчика. Первым аргументом будет объект события. Затем будут
             * аргументы, переданные в обработчик в шаблоне, и последними - аргументы в _notify */
            finalArgs = [eventObject];
            // Array.prototype.push.apply(finalArgs, templateArgs);
            Array.prototype.push.apply(finalArgs, eventObject.args);
            // Добавляем в eventObject поле со ссылкой DOM-элемент, чей обработчик вызываем
            // eventObject.currentTarget = curDomNode;
            const newEventName = repairEventName(eventName);
            convertedEvents[newEventName] = (eventObject.fn);
         });
      });

      const convertedAttributes = convertAttributes(mergedAttrs);

      const newProps = {
         ...convertedAttributes,
         ...convertedEvents,
         ref,
         key
      };

      if (Array.isArray(children)) {
         // Если передавать реакту детей массивом, он будет считать это списком и просить уникальные ключи каждому,
         // Мы же просто создаем вложенные элементы и поэтому разворачиваем массив
         return react.createElement(tagName, newProps, ...children);
      } else {
         return react.createElement(tagName, newProps);
      }
   }

   createEmptyText(key: string): string {
      return this.createText('', key);
   }

   getScope(data: TScope): Error | TScope {
      try {
         throw new Error('vdomMarkupGenerator: using scope="{{...}}"');
      } catch (e) {
         Logger.error('get SCOPE ... in VDom', data, e);
      }
      return data;
   }

   escape(value: GeneratorObject): GeneratorObject {
      return value;
   }

   createDirective(text: any): any {
      try {
         throw new Error('vdomMarkupGenerator createDirective not realized');
      } catch (e) {
         Logger.error('createDirective  ... in VDom', text, e);
      }
   }

   resolveTemplateFunction(parent: any, template: any, resolvedScope: any, decorAttribs: any, context: any): any {
      if (parent) {
         if (Common.isAnonymousFn(template)) {
            this.anonymousFnError(template, parent);
            return this.createText('', decorAttribs.key);
         }
         return template.call(parent, resolvedScope, decorAttribs, context, true, undefined, undefined, this.generatorConfig);
      }
      if (Common.isAnonymousFn(template)) {
         this.anonymousFnError(template, parent);
         return this.createText('', decorAttribs.key);
      }
      return template(resolvedScope, decorAttribs, context, true, undefined, undefined, this.generatorConfig);
   }

   resolveTemplate(template: any, parent: any, resolvedScope: any, decorAttribs: any, context: any): any {
      let resolvedTemplate = null;
      if (typeof template === 'function') {
         resolvedTemplate = this.resolveTemplateFunction(parent, template, resolvedScope, decorAttribs, context);
      } else if (typeof template.func === 'function') {
         resolvedTemplate = this.resolveTemplateFunction(parent, template.func, resolvedScope, decorAttribs, context);
      } else {
         resolvedTemplate = template;
      }
      if (Array.isArray(resolvedTemplate)) {
         if (resolvedTemplate.length === 1) {
            return resolvedTemplate[0];
         }
         if (resolvedTemplate.length === 0) {
            // return null so that resolveTemplateArray does not add
            // this to the result array, since it is empty
            return null;
         }
      }
      return resolvedTemplate;
   }

   resolveTemplateArray(parent: any, templateArray: any, resolvedScope: any, decorAttribs: any, context: any): any {
      let result = [];
      templateArray.forEach((template: any): any => {
         const resolvedTemplate = this.resolveTemplate(template, parent, resolvedScope, decorAttribs, context);
         if (Array.isArray(resolvedTemplate)) {
            result = result.concat(resolvedTemplate);
         } else if (resolvedTemplate) {
            result.push(resolvedTemplate);
         }
      });
      return result;
   }

   private anonymousFnError(fn: Function, parent: IControl): void {
      Logger.error(`Ошибка построения разметки. Была передана функция, которая не является шаблонной.
               Функция: ${fn.toString()}`, parent);
   }

}
