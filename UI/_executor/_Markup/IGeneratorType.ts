/// <amd-module name="UI/_executor/_Markup/IGeneratorType" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

// Служебные опции контрола
interface IGeneratorConstructor {
   logicParent: IControl;
   parent: IControl;
}

// Служебные опции контрола
interface IGeneratorInternalProperties extends IGeneratorConstructor {
   parentEnabled: boolean;
   hasOldParent: boolean;
   iWantBeWS3?: boolean;
   isOldControl?: boolean;
   parentVisible?: boolean;
}

// Коллекционируем Deferred-объекты
interface IGeneratorDefCollection {
   id: Array<string>;
   def: Array<Promise<any> | void>;
}

// Базовый интерфейс для атрибутов
interface IBaseAttrs {
   attributes: TAttributes;
   // FIXME: интерфейс IEvents объявлен в приватной библиотеке Vdom
   events: any;
   key: string;
}

// Есть кейсы, в которых контекст меняется в процессе выполнения
// поэтому все поля опциональные
interface IGeneratorAttrsContext {
   isTouch?: TObject;
   stickyHeader?: TObject;
   dataOptions?: TObject
}

// В prepareDateForCreate сейчас передаются объекты, массивы объектов и функции и строки.
// Объект, передаваемый в prepareDateForCreate
interface IGeneratorNameObject {
   library: string;
   module: Array<string>;
}

// Объект, передаваемый в массив объектов prepareDateForCreate
interface IGeneratorControlName {
   func: Function;
   internal: IGeneratorInternalProperties;
}

// Атрибуты контрола
interface IGeneratorAttrs extends IBaseAttrs {
   internal: IGeneratorInternalProperties;
   context: IGeneratorAttrsContext;
   inheritOptions: IGeneratorInheritOptions;
}

// В атрибутах контрола, опции могут быть унаследованы.
interface IGeneratorInheritOptions {
   readOnly: boolean;
   theme: string;
}

// Конфиг контрола
interface IGeneratorConfig {
   calculators: Array<IConfigCalculator>;
   iterators: Array<IConfigIterator>;
   ignored: Array<string>;
   mustBeDots: Array<string>;
   screen: string;
   moduleMaxNameLength: number;
   reservedWords: Array<string>;
   resolvers?: Array<string>;
}

// Базовый интерфейс конфига
interface IConfigBase {
   type: string;
   is: Function;
}

// Объект, передаваемый в calculators конфига
interface IConfigCalculator extends IConfigBase {
   calculator: Function;
}

// Объект, передаваемый в iterators конфига
interface IConfigIterator extends IConfigBase  {
   iterator: Function;
}

// Свойства шаблона контрола
interface ICreateControlTemplateCfg {
   data: TObject;
   ctx: IControl;
   viewController: IControl;
   pName: string;
}

// Данные контрола, собственные и служебные
interface IControlData {
   user: IControlUserData;
   internal: IGeneratorInternalProperties;
}

// Основная структура собственных данных контрола
interface IControlUserData extends IControlProperties {
   source: unknown[];
   itemTemplate: Function;
   allowChangeEnable?: boolean;
   __enabledOnlyToTpl?: boolean;
   __$config?: string;
   element?: unknown[];
   tabindex?: number;
}

// Подготовка к созданию контрола
interface IPrepareDataForCreate {
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
interface IControlProperties {
   key: string;
   name: string;
   esc: boolean;
   readOnly: boolean;
   theme: string;
   enabled: boolean;
   __key?: string;
   __noDirtyChecking?: boolean;
}

// Базовый контрол
interface IControl {
   _template: Function;
   _mounted: boolean;
   _unmounted: boolean;
   _destroyed: boolean;
   _$active: boolean;
   _reactiveStart: boolean;
   _options: TOptions;
   _internalOptions: TObject;
   _context: TObject;
   context: IControlContext;
   saveFullContext: Function;
   _saveContextObject: Function;
   _saveEnvironment: Function;
   saveInheritOptions: Function;
   _getEnvironment: Function;
   _notify: Function;
   _container: HTMLElement;
   _logicParent: IControl;
   _getMarkup: Function;
   render: Function;
   _children: TObject;
   _forceUpdate: Function;
   _instId: string;
   reactiveValues: TObject;
   __lastGetterPath: Array<string>;
}

// Контекст базовый контрола
interface IControlContext {
   get: Function;
   set: Function;
   has: Function;
}

// Основные атрибуты контрола
interface IPrepareDataForCreateAttrs {
   'ws-creates-context': string;
   'ws-delegates-tabfocus': string;
}

// встроенный инлайновый шаблон
interface IStringTemplateResolverIncludedTemplates {
   _itemTpm?: Function;
}

// Скопы для билдера
interface IBuilderScope extends IControlData {
   templateContext: TObject,
   inheritOptions: IGeneratorInheritOptions,
   key: string
}

interface ITplFunction {
   func: Function
}

// Опции для ноды в слое совместимости
interface INodeAttribute {
   name: string;
}

// Тип для контролов в слое совместимости
type WsControlOrController = string | Function | TObject;
// Обобщенные типы для генератора, уменьшают громоздкость кода генераторов
type GeneratorFn = string | Function | ITplFunction;
type GeneratorVoid = string | undefined;
type GeneratorError = string | Error;
type GeneratorObject = string | TObject;
type GeneratorEmptyObject = TObject | void;
type GeneratorStringArray = Array<string[] | string>;

// Тип исходных данных для подготовки к построению контрола
type GeneratorTemplateOrigin = GeneratorFn | IGeneratorNameObject | Array<IGeneratorControlName>;

// Типы сопоставления для случаев когда однозначно описать тип не можем
type TObject = Record<string, unknown>;
type TOptions = Record<string, unknown>;
type TScope = Record<string, unknown>;
type TDeps = Record<string, unknown>;
type TIncludedTemplate = Record<string, unknown>;
type TAttributes = Record<string, unknown>;
type TEvents = Record<string, unknown>;

export {
   IGeneratorNameObject,
   IGeneratorConfig,
   IGeneratorAttrs,
   IGeneratorDefCollection,
   IGeneratorControlName,
   IControlData,
   IControl,
   IControlUserData,
   IGeneratorConstructor,
   IGeneratorInternalProperties,
   IGeneratorAttrsContext,
   IGeneratorInheritOptions,
   ICreateControlTemplateCfg,
   IPrepareDataForCreate,
   IBaseAttrs,
   IStringTemplateResolverIncludedTemplates,
   IBuilderScope,
   IControlProperties,
   ITplFunction,
   INodeAttribute,
   WsControlOrController,
   GeneratorTemplateOrigin,
   GeneratorFn,
   GeneratorVoid,
   GeneratorError,
   GeneratorObject,
   GeneratorEmptyObject,
   GeneratorStringArray,
   TObject,
   TOptions,
   TScope,
   TDeps,
   TIncludedTemplate,
   TAttributes,
   TEvents
}
