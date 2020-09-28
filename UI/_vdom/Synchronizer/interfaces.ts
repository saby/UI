import Control, { IControlOptions } from 'UI/_base/Control';
import { IOptions } from 'UI/_vdom/Synchronizer/resources/Options';
import { VNode } from 'Inferno/third-party/index';

export type TComponentAttrs = Record<string, unknown>;

export type TControlId = string;
// VdomMarkup.getDecoratedMark

type IControlConstructor = () => Control;
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
export interface IControlNode extends IRebuildNode {
    attributes: any;
    events: TEventsObject;
    control: Control;
    contextVersions: IObjectsVersions<TContext>;
    context: TContext;
    oldContext: TContext;
    errors: object | undefined;
    element: IWasabyHTMLElement;
    controlClass: IControlConstructor;
    options: IOptions;
    oldOptions: IOptions;
    internalOptions: IControlOptions;
    optionsVersions: IObjectsVersions<IControlOptions>;
    inheritOptions: IControlOptions;
    internalVersions: IObjectsVersions<IControlOptions>;
    id: TControlId;
    parent: IControlNode;
    key: TControlId;
    defaultOptions: IControlOptions;
    markup: VNode | undefined;
    fullMarkup: VNode | undefined;
    childrenNodes: IControlNode[];
    markupDecorator: Function;
    serializedChildren: IControlNode[];
    hasCompound: false;
    receivedState: undefined;
    invisible: boolean;
    vnode: VNode;
    environment: IDOMEnvironment;

    // TODO это нужно вынести в расширенные интерфейсы
    _moduleName?: string;  // это добавляет какой то Executor

    // мы не должны зависить от UI/Focus._IDOMEnvironment, поэтому определю тут
    _rootDOMNode: TModifyHTMLNode;
    __captureEventHandler: Function;
}

export interface ICompatableControl {
    _parent?: ICompatableControl;
    hasCompatible(): () => boolean;
    isDestroyed: () => any;
}

export interface ICompatableNode {
    control: ICompatableControl;
}

export type TControlStateCollback = (nodeId: TControlId) => void;

// Наверное, здесь им здесь не место, но для рефактора Hooks они были срочно нужны.
export interface IEvent {
    args: any[];
    controlNode: IControlNode;
    fn: () => void;
    name: string;
    toPartial?: boolean;
    value: string;
}

export type TEventsObject = Record<string, IEvent[]>;

export interface IWasabyHTMLElement extends HTMLElement {
    controlNodes: IControlNode[];
    eventProperties: TEventsObject;
    eventPropertiesCnt: number;
}

export interface IProperties {
    attributes: Record<string, string>;
    hooks: Record<string, any>;
    events: TEventsObject;
}

export type TModifyHTMLNode = HTMLElement & Record<string, any>;

export type TMarkupNodeDecoratorFn = (
    tagName: string,
    properties: IProperties,
    children: any,
    key: TControlId,
    controlNode: any,
    ref: any
) => VNode[];

export interface IHandlerInfo {
    handler: (evt: Event) => void;
    bodyEvent: boolean;
    processingHandler: boolean;
    count: number;
}

export interface IDOMEnvironment {
    addTabListener(e?: any): void;
    removeTabListener(e: any): void;
    destroy(): void;

    setRebuildIgnoreId(id: string): void;

    _handleFocusEvent(e: any): void;
    _handleBlurEvent(e: any): void;
    _handleMouseDown(e: any): void;
    _handleClick(event: any): void;
    _handleTouchstart(event: any): void;
    _handleTouchmove(event: any): void;
    _handleTouchend(event: any): void;
    _shouldUseClickByTap(): boolean;

    applyNewVNode(newVNnode: any, rebuildChanges: any, newRootCntNode: any): void;
    decorateFullMarkup(vnode: VNode, controlNode: any): VNode;
    getMarkupNodeDecorator(): TMarkupNodeDecoratorFn;
    getDOMNode(): HTMLElement;

    startEvent(controlNode: any, args: any): any;
    getHandlerInfo(eventName: string, processingHandler: boolean, bodyEvent: boolean): IHandlerInfo | null;
    addHandler(eventName: string, isBodyElement: boolean, handler: any, processingHandler: boolean): void;
    addNativeListener(
        element: HTMLElement,
        handler: any,
        eventName: string,
        config: any,
        options?: boolean | AddEventListenerOptions
    ): void;
    removeHandler(eventName: string, isBodyElement: boolean, processingHandler: boolean): any;
    removeNativeListener(element: HTMLElement, handler: EventListener, eventName: string, capture: boolean): any;
    addCaptureEventHandler(eventName: string, element: IWasabyHTMLElement): any;
    addCaptureProcessingHandler(eventName: string, method: (event: Event) => void): any;
    removeCaptureEventHandler(eventName: string, element: IWasabyHTMLElement): void;
    removeAllCaptureHandlers(): void;
    removeProcessiingEventHandler(eventName: string): void;
    _canDestroy(destroyedControl: Control): any;

    setupControlNode(controlNode: IControlNode): void;

    queue?: string[];

    _currentDirties: Record<string, number>;
    _nextDirties: Record<string, number>;
    activateSubQueue: undefined;

    // FIXME это не должно быть публичным. Найти все ссылки и разобраться
    _rootDOMNode: TModifyHTMLNode;
    __captureEventHandler: Function;
    _rebuildRequestStarted?: boolean;
    _haveRebuildRequest?: boolean;
}
