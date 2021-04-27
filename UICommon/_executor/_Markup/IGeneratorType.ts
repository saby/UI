/// <amd-module name="Core/_Markup/IGeneratorType" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

import {
   ICommonControlNode as IControlNode,
   IControl
} from 'UICommon/interfaces';

// Служебные опции контрола
export interface IGeneratorConstructor {
   logicParent: IControl;
   parent: IControl;
}

// Служебные опции контрола
export interface IGeneratorInternalProperties extends IGeneratorConstructor {
   parentEnabled: boolean;
   hasOldParent: boolean;
   iWantBeWS3?: boolean;
   isOldControl?: boolean;
   parentVisible?: boolean;
}

// Коллекционируем Deferred-объекты
export interface IGeneratorDefCollection {
   id: Array<string>;
   def: Array<Promise<any> | void>;
}

// Базовый интерфейс для атрибутов
export interface IBaseAttrs {
   attributes: TAttributes;
   // FIXME: интерфейс IEvents объявлен в приватной библиотеке Vdom
   events: any;
   key: string;
}

// Есть кейсы, в которых контекст меняется в процессе выполнения
// поэтому все поля опциональные
export interface IGeneratorAttrsContext {
   isTouch?: TObject;
   stickyHeader?: TObject;
   dataOptions?: TObject
}

// В prepareDateForCreate сейчас передаются объекты, массивы объектов и функции и строки.
// Объект, передаваемый в prepareDateForCreate
export interface IGeneratorNameObject {
   library: string;
   module: Array<string>;
   fullName: string;
}

// Объект, передаваемый в массив объектов prepareDateForCreate
export interface IGeneratorControlName {
   func: Function;
   internal: IGeneratorInternalProperties;
}

// Атрибуты контрола
export interface IGeneratorAttrs extends IBaseAttrs {
   internal: IGeneratorInternalProperties;
   context: IGeneratorAttrsContext;
   inheritOptions: IGeneratorInheritOptions;
}

// В атрибутах контрола, опции могут быть унаследованы.
export interface IGeneratorInheritOptions {
   readOnly: boolean;
   theme: string;
}

// Конфиг контрола
export interface IGeneratorConfig {
   calculators?: Array<IConfigCalculator>;
   iterators?: Array<IConfigIterator>;
   ignored?: Array<string>;
   mustBeDots?: Array<string>;
   screen?: string;
   moduleMaxNameLength?: number;
   reservedWords?: Array<string>;
   resolvers?: Array<string>;

   prepareAttrsForPartial?(attrs: any): void;
   prepareAttrsForRoot?(attrs: any, options: any): void;
}

// Базовый интерфейс конфига
export interface IConfigBase {
   type: string;
   is: Function;
}

// Объект, передаваемый в calculators конфига
export interface IConfigCalculator extends IConfigBase {
   calculator: Function;
}

// Объект, передаваемый в iterators конфига
export interface IConfigIterator extends IConfigBase  {
   iterator: Function;
}

// Свойства шаблона контрола
export interface ICreateControlTemplateCfg {
   data: TObject;
   ctx: IControl;
   viewController: IControl;
   pName: string;
}

// Данные контрола, собственные и служебные
export interface IControlData {
   user: IControlUserData;
   internal: IGeneratorInternalProperties;
}

// Основная структура собственных данных контрола
export interface IControlUserData extends IControlProperties {
   source: unknown[];
   itemTemplate: Function;
   allowChangeEnable?: boolean;
   __enabledOnlyToTpl?: boolean;
   __$config?: string;
   element?: unknown[];
   tabindex?: number;
}

// Подготовка к созданию контрола
export interface IPrepareDataForCreate {
   logicParent: IControl;
   parent: IControl;
   attrs: IPrepareDataForCreateAttrs;
   controlProperties: IControlProperties;
   dataComponent: string;
   internal: IGeneratorInternalProperties;
   controlClass: Function;
   compound: boolean;
}

// Свойства контрола
export interface IControlProperties {
   key: string;
   name: string;
   esc: boolean;
   readOnly: boolean;
   theme: string;
   enabled: boolean;
   __key?: string;
   __noDirtyChecking?: boolean;
}

// Основные атрибуты контрола
export interface IPrepareDataForCreateAttrs {
   'ws-creates-context': string;
   'ws-delegates-tabfocus': string;
}

// Скопы для билдера
export interface IBuilderScope extends IControlData {
   templateContext: TObject,
   inheritOptions: IGeneratorInheritOptions,
   key: string
}

export interface ITplFunction {
   func: Function
}

// Опции для ноды в слое совместимости
export interface INodeAttribute {
   name: string;
}

// Тип для контролов в слое совместимости
export type WsControlOrController = string | Function | TObject;
// Обобщенные типы для генератора, уменьшают громоздкость кода генераторов
export type GeneratorFn = string | Function | ITplFunction;
export type GeneratorVoid = string | undefined;
export type GeneratorError = string | Error;
export type GeneratorObject = string | TObject;
export type GeneratorEmptyObject = TObject | void;
export type GeneratorStringArray = Array<string[] | string>;

// Тип исходных данных для подготовки к построению контрола
export type GeneratorTemplateOrigin = GeneratorFn | IGeneratorNameObject | Array<IGeneratorControlName>;

// Типы сопоставления для случаев когда однозначно описать тип не можем
export type TObject = Record<string, unknown>;
export type TOptions = Record<string, unknown>;
export type TScope = Record<string, unknown>;
export type TDeps = Record<string, unknown>;
export type TIncludedTemplate = Record<string, unknown>;
export type TAttributes = Record<string, unknown>;
export type TEvents = Record<string, unknown>;

export interface IControlConfig {
   compositeAttributes: any;
   attr: any;
   data: any;
   ctx: any;
   isVdom: boolean;
   context: any;
   depsLocal: any;
   includedTemplates: any;
   pName: string;
   viewController: any;
   isRootTag: boolean;
   internal: any;
   scope: any;
   key: any;
   defCollection: any;
   mergeType: 'none' | 'attribute' | 'context';
}

// Типы сопоставления для случаем когда однозначно описать тип не можем
export type TProps = Record<string, any>;

// Для поддержки ExecutorCompatible из ws
export { IControl } from 'UICommon/interfaces';

export interface ITemplateNode {
   compound: false;
   template: Function & any,
   controlProperties: TProps,
   parentControl: IControlNode,
   attributes: TAttributes,
   context: IGeneratorAttrsContext,
   type: 'TemplateNode',
   key: string;
   flags: 262144;
   coutn: number;
}
