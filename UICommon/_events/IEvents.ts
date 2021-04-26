import { ICommonControlNode as IControlNode, ICommonDOMEnvironment as IDOMEnvironment, IWasabyHTMLElement } from 'UICommon/interfaces';
import { IControl } from 'UICommon/interfaces';

type VoidFunction = () => void;

export interface ISyntheticEvent {
    nativeEvent: Event;
    type: string;
    target: EventTarget;
    currentTarget: EventTarget;
    stopPropagation: Function;
    isStopped: Function;
    isBubbling: Function;
    preventDefault: Function;
    propagating: Function;
    stopImmediatePropagation: Function;
    result?: unknown;
}

export interface IEventConfig {
    _bubbling?: boolean;
    type?: string;
    target?: EventTarget;
    passive?: boolean;
    capture?: boolean;
}

export interface IClickState {
    detected: boolean;
    stage: string;
    timer: unknown;
    timeout: number;
    target: EventTarget;
    touchCount: number;
    timeStart: unknown;
}

export interface IFixedEvent extends Event {
    _dispatchedForIE?: boolean;
}

export interface IHandlerInfo {
    handler: (evt: Event) => void;
    bodyEvent: boolean;
    processingHandler: boolean;
    count: number;
}

export interface IArrayEvent {
    fn: Record<string, Function>;
    finalArgs: Record<string, unknown>[];
}

export interface IClickEvent {
    type: string;
    bubbles: boolean;
    cancelable: boolean;
    view: Window;
    detail: number;
    screenX: number;
    screenY: number;
    clientX: number;
    clientY: number;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
    button: number,
    buttons: number,
    relatedTarget: EventTarget;
    target: EventTarget;
    currentTarget: EventTarget;
    eventPhase: number,
    stopPropagation: VoidFunction;
    preventDefault: VoidFunction;
}

export interface IWasabyEvent {
    args: unknown[];
    context: Function;
    handler: Function;
    isControl: boolean;
    value: string;
    viewController: IControl;
}

export interface IWasabyEventSystem {
    captureEventHandler: (event: Event) => void;
    callEventsToDOM: VoidFunction;
    handleSpecialEvent: (eventName: string, eventHandler: Function, environment: IDOMEnvironment) => void;
    addTabListener: VoidFunction;
    removeTabListener: VoidFunction;
    startEvent: <TArguments>(controlNode: IControlNode, args: TArguments) => any;
    addCaptureEventHandler: (eventName: string, element: HTMLElement) => void;
    removeCaptureEventHandler: (eventName: string, element: IWasabyHTMLElement) => void;
}
