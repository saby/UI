import {_IGeneratorType} from 'UI/Executor';

export type TemplateFunction = (data: object, attr?: object, context?: string, isVdom?: boolean, sets?: object,
                                forceCompatible?: boolean,
                                generatorConfig?: _IGeneratorType.IGeneratorConfig) => string | object;

export interface IControlOptions {
   readOnly?: boolean;
   theme?: string;
   _logicParent?: IControl;
}
export interface IEvent {
   args: any[];
   controlNode: IControlNode;
   fn: () => void;
   name: string;
   toPartial?: boolean;
   value: string;
   isControl: boolean;
}
export interface ICoreControlOptions extends IControlOptions {
   [key: string]: unknown;
}
export interface ITemplateAttrs {
   key?: string;
   internal?: Record<string, object>;
   inheritOptions?: Record<string, ICoreControlOptions>;
   attributes?: Record<string, object>;
   templateContext?: Record<string, object>;
   context?: Record<string, object>;
   domNodeProps?: Record<string, object>;
   events?: Record<string, IEvent[]>;
}

export interface IDOMEnvironment {
   _rootDOMNode: HTMLElement;
   __captureEventHandlers: object;
   startEvent: (controlNode: IControlNode, args: IArguments) => void;
}
export interface IControlNode {
   control: IControl;
   element: HTMLElement;
   environment: IDOMEnvironment;
   id: string;
}

export interface IControlState {
   loading: boolean;
}

export type IControlChildren = Record<string, Element | IControl | IControl<IControlOptions, {}>>;

export type TIState = void | {};

export type TControlConstructor<TOptions extends IControlOptions = {}, TState extends TIState = void> =
   new(cfg: TOptions) => IControl<TOptions, TState>;

export interface IControl<TOptions extends IControlOptions = {}, TState extends TIState = void> {
   _forceUpdate: () => void;
   _parentHoc: IControl;
   _getEnvironment: () => IDOMEnvironment;
   _logicParent: IControl;
   _container: HTMLElement;
   getInstanceId: () => string;
   _options: IControlOptions;
}
