/// <amd-module name="UICommon/_executor/_Markup/IGenerator" />
/* tslint:disable */

import {
   IGeneratorConfig,
   IGeneratorDefCollection,
   IBaseAttrs,
   WsControlOrController,
   GeneratorFn,
   GeneratorVoid,
   GeneratorError,
   GeneratorObject,
   GeneratorEmptyObject,
   GeneratorStringArray,
   TScope,
   TDeps,
   TIncludedTemplate,
   TAttributes,
   GeneratorTemplateOrigin,
   IGeneratorAttrs,
   IControlProperties,
   IControlData,
   ICreateControlTemplateCfg,
   ITemplateNode,
   IControlConfig
} from './IGeneratorType';
import { IControl }  from 'UICommon/interfaces';

/**
 * @author Тэн В.А.
 */
export interface IGenerator {

   createControlNew(
      type: string,
      method: Function,
      attributes: Record<string, unknown>,
      events: Record<string, unknown>,
      options: Record<string, unknown>,
      config: IControlConfig
   ): GeneratorObject | Promise<unknown> | Error

   /**
    * Соибирает цепочку Promise
    * @param out
    * @param defCollection
    * @param inst
    * @returns {string | Error}
    */
   chain(out: string, defCollection: IGeneratorDefCollection, inst?: IControl): Promise<string|void> | string | Error;

   /**
    * Точка входа в создание контрола/контроллера/шаблона
    * @param type
    * @param name
    * @param data
    * @param attrs
    * @param templateCfg
    * @param context
    * @param deps
    * @param includedTemplates
    * @param config
    * @param contextObj
    * @param defCollection
    * @returns {string | object | Promise<unknown> | Error}
    */
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
                 defCollection?: IGeneratorDefCollection | void): GeneratorObject | Promise<unknown> | Error

   /**
    * Точка входа в создание контрола (компонент с шаблоном)
    * @param name
    * @param data
    * @param data
    * @param attrs
    * @param templateCfg
    * @param context
    * @param deps
    * @returns {string | object | Promise<unknown> | Error}
    */
   prepareWsControl(name: GeneratorTemplateOrigin,
                    data: IControlData,
                    attrs: IGeneratorAttrs,
                    templateCfg: ICreateControlTemplateCfg,
                    context: string,
                    deps: TDeps): GeneratorObject | Promise<unknown> | Error

   /**
    * Точка входа в создание шаблона
    * @param name
    * @param data
    * @param data
    * @param attrs
    * @param templateCfg
    * @param context
    * @param deps
    * @param config
    * @returns {string | object | Promise<unknown> | Error}
    */
   prepareTemplate(name: GeneratorTemplateOrigin,
                   data: IControlData,
                   attrs: IGeneratorAttrs,
                   templateCfg: ICreateControlTemplateCfg,
                   context: string,
                   deps: TDeps,
                   config: IGeneratorConfig): GeneratorObject | Promise<unknown> | Error

   /**
    * Точка входа в создание контроллера (компонент без шаблона)
    * @param name
    * @param data
    * @param data
    * @param attrs
    * @param templateCfg
    * @param context
    * @param deps
    * @returns {string | object | Promise<unknown> | Error}
    */
   prepareController(name: GeneratorTemplateOrigin,
                    data: IControlData,
                    attrs: IGeneratorAttrs,
                    templateCfg: ICreateControlTemplateCfg,
                    context: string,
                    deps: TDeps): GeneratorObject | Promise<unknown> | Error

   /**
    * Точка входа в создание резолвера (когда не знаем заранее что создаем)
    * @param name
    * @param data
    * @param data
    * @param attrs
    * @param templateCfg
    * @param context
    * @param deps
    * @param includedTemplates
    * @param config
    * @param contextObj
    * @param defCollection
    * @returns {string | object | Promise<unknown> | Error}
    */
   prepareResolver(name: GeneratorTemplateOrigin,
                   data: IControlData,
                   attrs: IGeneratorAttrs,
                   templateCfg: ICreateControlTemplateCfg,
                   context: string,
                   deps: TDeps,
                   includedTemplates: TIncludedTemplate,
                   config: IGeneratorConfig,
                   contextObj?: GeneratorEmptyObject,
                   defCollection?: IGeneratorDefCollection | void): GeneratorObject | Promise<unknown> | Error

   /**
    * Создание текста
    * @param text
    * @param key?
    * @return {string} text
    */
   createText(text: string, key?: string): string;

   /**
    * Создание компонента с шаблоном
    * @param tpl
    * @param scope
    * @param attributes
    * @param context
    * @param _deps
    * @param data
    * @return {WsControlOrController} buildMarkupForClass
    */
   createWsControl(tpl: GeneratorTemplateOrigin,
                   scope: IControlProperties,
                   attributes: IGeneratorAttrs,
                   context: string,
                   _deps?: TDeps,
                   data?): WsControlOrController | GeneratorVoid ;

   /**
    * Создание шаблона
    * @param name
    * @param scope
    * @param attributes
    * @param context
    * @param _deps
    * @param config
    * @return {string} template
    */
   createTemplate(
      name: string,
      scope: IControlProperties,
      attributes: IGeneratorAttrs,
      context: string,
      _deps: TDeps,
      config?: IGeneratorConfig): ITemplateNode;

   /**
    * Создание компонента без шаблона
    * @param cnstr
    * @param scope
    * @param attributes
    * @param context
    * @param _deps
    * @return {string} controller
    */
   createController(cnstr: string | Function,
                    scope: IControlProperties,
                    attributes: TAttributes,
                    context: string,
                    _deps?: TDeps): string;

   /**
    * Когда заранее неизвестно пришел шаблон или контрол.
    * @param tpl
    * @param preparedScope
    * @param decorAttribs
    * @param context
    * @param _deps
    * @param includedTemplates
    * @param config
    * @param defCollection
    * @param _deps
    * @return {Function} templateFunction
    */

   // было GeneratorStringArray | GeneratorFn;
   resolver(tpl: GeneratorTemplateOrigin,
            preparedScope: IControlProperties,
            decorAttribs: IGeneratorAttrs,
            context: string,
            _deps: TDeps,
            includedTemplates: TIncludedTemplate,
            config: IGeneratorConfig,
            defCollection: IGeneratorDefCollection): GeneratorStringArray | GeneratorFn;

   /**
    * Рекуриснове объединение элементов, если пришел массив из partial
    * @param elements
    * @param key
    * @param defCollection
    * @return {Array<object | string> | string | Error}
    * @return {Array<object | string> | string | Error}
    */
   joinElements(elements: GeneratorStringArray,
                key?: string,
                defCollection?: IGeneratorDefCollection): GeneratorStringArray | GeneratorError;

   /**
    *
    * @param tag
    * @param attrs Собственные атрибуты
    * @param children
    * @param attrToDecorate
    * @param defCollection
    * @param control
    * @returns {string}
    */
   createTag(tag: string,
             attrs: IBaseAttrs,
             children: GeneratorStringArray,
             attrToDecorate?: TAttributes,
             defCollection?: IGeneratorDefCollection,
             control?: GeneratorEmptyObject): string;

   /**
    * Создает пустую текстовую ноду
    */
   createEmptyText(key?: string): string;

   /**
    * Получает текущий скоп (в VDOM генераторе должен выбрасывать ошибку)
    * @param date
    * @returns {object}
    */
   getScope(date: TScope): Error | TScope;

   /**
    * Эскейп тегов
    * @param value
    * @return {object | string} value
    */
   escape(value: GeneratorObject): GeneratorObject;

   /**
    * Создает кастомный тег (в VDOM генераторе должен выбрасывать ошибку)
    * @param text
    * @returns {string}
    */
   createDirective(text: string): GeneratorVoid;
}
