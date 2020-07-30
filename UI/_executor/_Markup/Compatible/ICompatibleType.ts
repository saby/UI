import {
   IBuilderScope,
   TObject,
   TAttributes,
   TOptions,
   IGeneratorInternalProperties
} from '../IGeneratorType';

/**
 * @author Тэн В.А.
 */

// Минимальный вариант ноды Core/markup/ParserUtilities
export interface INode {
   startTag: string;
   closeTag: string;
   nodeType: number;
   nodeName: string;
   attributes: INodeAttribute;
   childNodes: TObject[];
   parentNode: undefined;
   sequence: TObject[];
   text: string;
   _junk: TObject[];
}

// Базовые опции для слоя совместимости
export interface IOptionsCompatibleBase {
   'data-component': string;
   parent: IControlCompatible;
   enabled: boolean;
   name: string;
   tabindex: number;
   __$config: string;
   allowChangeEnable: boolean | string;
}

// Опции для ноды в слое совместимости
export interface INodeAttribute extends IOptionsCompatibleBase {
   config: string;
   hasMarkup: string;
   __config: string;
   __wasOldControl: boolean;
   class?: string;
}

// Опции для V-ноды в слое совместимости
export interface IOptionsCompatible extends IOptionsCompatibleBase {
   readOnly: boolean;
   theme: string;
   element: INode[];
   linkedContext: IContextCompatible;
   context: IContextCompatible;
   internal: IGeneratorInternalProperties;
   user: IOptionsCompatible;
   source: unknown[];
   itemTemplate: Function;
   allowChangeEnable: boolean | string;
   __enabledOnlyToTpl: boolean;
   __$config: string;
   enabled: boolean;
   tabindex: number;
}

// Опции для ноды с фиксом
export interface IOptionsCompatibleFixed extends IOptionsCompatible {
   __$fixDecOptions: INodeAttribute;
}

// Биндинги в слое совместимости
export interface IBindingCompatible {
   _options: IOptionsCompatible;
   scope: IBuilderScope;
}

// Базовые данные инстанса
export interface IDefaultInstanceData {
   _options: IControlUserDataCompatible;
   _keysWeHandle: number[];
   _validationErrorCount: number;
   _validating: boolean;
   _prevValidationResult: boolean;
   _errorMessage: string;
   _dataBind: TObject;
   _iconTemplate: Function;
   _checkClickByTap: boolean;
   _maxTouchCount: number;
}

// Маркап для совместимого контрола
export interface IMarkupForCompatible extends IBindingCompatible {
   resultingFn: TResultingFunction;
   defaultInstanceData: IDefaultInstanceData;
}

// Базовый контекс в слое совместимости
export interface IContextCompatible {
   _goUp: number;
   _options: TOptions;
   _isEmpty: boolean;
   _contextObject: TContext;
   _isInitialized: boolean;
}

// События
export interface IEvent {
   handler: Function;
   control: IControlCompatible;
   event: string;
}

// Обработчики на контроле
interface IContolHandler {
   handler: Function;
   control: IControlCompatible;
}

// Интерфейс совместимого контрола
export interface IControlCompatible extends IContextCompatible {
   _restrictFlags: number;
   _previousContext: IContextCompatible;
   _context: IContextCompatible;
   _parentContextDataBindHandler: Function;
   _parentContextFieldUpdateHandler: Function;
   _updateLockCnt: number;
   _updatedEventsCnt: number;
   _fieldSubscriptions: TObject;
   _handlers: TObject;
   _subscriptions: IEvent[];
   _subDestroyControls: IContolHandler[];
   _parentContextFieldsChangedHandler: Function;
   _parentContextFieldRemovedHandler: Function;
   _isAbstractInitialized: boolean;
   _eventBusChannel: TObject;
}

// Совместимый инстанс (используется для корректной работы биндингов)
export interface IInstanceCompatible {
   instance: IInstanceExtendetCompatible;
   resolvedOptions: TOptions;
   defaultOptions: TOptions;
}

export interface IInstanceExtendetCompatible {
   _template: string;
   saveOptions: Function;
   _options: TOptions;
   hasCompatible: Function;
   _beforeMountLimited: Function;
   _beforeMountCalled: boolean;
   saveInheritOptions: Function;
   _saveContextObject: Function;
   saveFullContext: Function;
   render: Function;
   destroy: Function;
   __destory_origin: Function;
   _decOptions: Record<string, unknown>;
}

// Внутренние опции
export interface IInternalCompatible {
   logicParent: never;
   parent: never;
   parentEnabled: boolean;
   hasOldParent: boolean;
   isOldControl: boolean;
}

// Данные для подготовки к построению контрола
export interface IBuilderData {
   attrs: TAttributes;
   controlProperties: IOptionsCompatibleBase;
   dataComponent: string;
   internal: IInternalCompatible;
   controlClass: Function;
   compound: boolean;
}

export interface IControlDataCompatible {
   user: IOptionsCompatible;
   internal: IGeneratorInternalProperties;
   bindings?: IBindingData[];
   tabindex?: number;
   __$config?: string;
}

interface IBindingData {
   bindNonExistent: Record<string, unknown>;
   propName: string;
   nonExistentValue: IControlDataCompatible;
}

export interface IControlClass {
   contextTypes?: Function;
}

// Основная структура собственных данных контрола
interface IControlUserDataCompatible {
   source: unknown[];
   itemTemplate: Function;
   allowChangeEnable: boolean | string;
   __enabledOnlyToTpl: boolean;
   __$config: string;
   enabled: boolean;
   element: unknown[];
   tabindex: number;
}

// Типы сопоставления для случаев когда однозначно описать тип не можем
export type TContext = Record<string, unknown>;
export type TInstance = Record<string, unknown>;
export type TReceivedState = Record<string, unknown>;
export type TContextConstructor<T> = new (...args: any[]) => T;
export type TResultingFunction = Function & {stable: boolean};
