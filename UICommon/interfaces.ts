import { IOptions } from 'UICommon/Vdom';
import { IWasabyEventSystem } from 'UICommon/Events';
import { IControlOptions } from 'UICommon/Base';
import { TObject } from 'UICommon/Executor';

export type TControlId = string;
// VdomMarkup.getDecoratedMark
// tslint:disable: member-ordering

export type TControlConfig = IControlOptions & {
    [key: string]: any;
    _logicParent?: IControl;
    _$createdFromCode?: boolean;
};

// Контекст базовый контрола
export interface IControlContext {
   get: Function;
   set: Function;
   has: Function;
}


// Базовый контрол
export interface IControl {
    _template: Function;
    _mounted: boolean;
    _unmounted: boolean;
    _destroyed: boolean;
    _$active: boolean;
    _reactiveStart: boolean;
    _options: IControlOptions;
    _internalOptions: TObject;
    _context: TObject;
    context: IControlContext;
    saveFullContext: Function;
    _getChildContext?: Function;
    _saveContextObject: Function;
    _saveEnvironment: Function;
    saveInheritOptions: Function;
    _getEnvironment: Function;
    _notify: Function;
    _container: HTMLElement;
    _logicParent: IControl;
    _getMarkup: (rootKey?: string, attributes?: object, isVdom?: boolean) => any;
    render: Function;
    _children: TObject;
    _forceUpdate: Function;
    _instId: string;
    reactiveValues?: TObject;
    __lastGetterPath?: [];

    readonly prototype?: {
       _moduleName: string;
       _template?: Function;
       _dotTplFn?: Function;
    };

    props?: {
       readOnly: boolean;
       theme: string;
    };
 }

interface IState {
}
export type TIState = void | IState;

export type TControlConstructor<TOptions extends IControlOptions = {}> = {
    new(cfg: TOptions): IControl;
    prototype: IControl;
};

type TContext = Record<string, object>;
type IObjectsVersions<T> = {
    [key in keyof T]: number
};

export interface IAttrs extends Object {
    // @ts-ignore
    [key: string]: any;
}

export interface IRootAttrs extends IAttrs {
    ['data-component']?: string | null;
}

interface IRebuildNode {
    rootId: number;  // это добавляет какой то Syncronizer
    requestDirtyCheck: (controlNode: IRebuildNode) => void;  // это добавляет какой то Syncronizer
}

interface ICoreControlOptions extends IControlOptions {
    [key: string]: unknown;
}

export interface ICommonControlNode extends IRebuildNode {
    attributes: any;
    events: TEventsObject;
    control: IControl;
    contextVersions: IObjectsVersions<TContext>;
    context: TContext;
    oldContext: TContext;
    errors: object | undefined;
    element: IWasabyHTMLElement;
    options: IOptions;
    oldOptions: IOptions;
    internalOptions: ICoreControlOptions;
    optionsVersions: IObjectsVersions<ICoreControlOptions>;
    inheritOptions: ICoreControlOptions;
    internalVersions: IObjectsVersions<ICoreControlOptions>;
    id: TControlId;
    parent: ICommonControlNode;
    key: TControlId;
    defaultOptions: ICoreControlOptions;
    markup?: { type?: string, moduleName?: string };
    fullMarkup?: { type?: string, moduleName?: string };
    childrenNodes: ICommonControlNode[];
    markupDecorator: Function;
    serializedChildren: ICommonControlNode[];
    hasCompound: false;
    receivedState: undefined;
    invisible: boolean;

    // TODO это нужно вынести в расширенные интерфейсы
    _moduleName?: string;  // это добавляет какой то Executor

    // мы не должны зависить от UICore/Focus._IDOMEnvironment, поэтому определю тут
    _rootDOMNode: TModifyHTMLNode;
    __captureEventHandler: Function;
}

// Наверное, здесь им здесь не место, но для рефактора Hooks они были срочно нужны.
export interface IEvent {
    args: any[];
    controlNode: ICommonControlNode;
    fn: () => void;
    name: string;
    toPartial?: boolean;
    value: string;
}

export type TEventsObject = Record<string, IEvent[]>;

export interface IWasabyHTMLElement extends HTMLElement {
    controlNodes: ICommonControlNode[];
    eventProperties: TEventsObject;
    eventPropertiesCnt: number;
}

export interface IProperties {
    attributes: Record<string, string>;
    hooks: Record<string, any>;
    events: TEventsObject;
}

export type TModifyHTMLNode = HTMLElement & Record<string, any>;

export interface IHandlerInfo {
    handler: (evt: Event) => void;
    bodyEvent: boolean;
    processingHandler: boolean;
    count: number;
}
export interface ICommonDOMEnvironment {
    destroy(): void;

    setRebuildIgnoreId(id: string): void;

    _handleFocusEvent(e: any): void;
    _handleBlurEvent(e: any): void;
    _handleMouseDown(e: any): void;

    getDOMNode(): HTMLElement;

    showCapturedEvents(): Record<string, IHandlerInfo[]>;

    queue: TControlId[];

    _currentDirties: Record<string, number>;
    _nextDirties: Record<string, number>;

    // FIXME это не должно быть публичным. Найти все ссылки и разобраться
    _rootDOMNode: TModifyHTMLNode;
    __captureEventHandler: Function;
    _rebuildRequestStarted?: boolean;
    _haveRebuildRequest?: boolean;
    eventSystem: IWasabyEventSystem;
}
