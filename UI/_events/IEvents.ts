import {IControlNode, IDOMEnvironment, IWasabyHTMLElement, TModifyHTMLNode} from 'UI/_vdom/Synchronizer/interfaces';

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

export interface IWasabyEventSystem {
    initWasabyEventSystem: (rootNode: TModifyHTMLNode) => void;
    captureEventHandler: (event: Event, environment?: IDOMEnvironment) => void;
    callEventsToDOM: VoidFunction;
    handleSpecialEvent: (eventName: string, eventHandler: Function) => void;
    // а должен ли он быть публичным?
    _handleTabKey: (event: KeyboardEvent, tabKeyHandler: Function) => void;
    addTabListener: VoidFunction;
    removeTabListener: VoidFunction;
    startEvent: <TArguments>(controlNode: IControlNode, args: TArguments) => any;
    addCaptureEventHandler: (eventName: string, element: HTMLElement) => void;
    removeCaptureEventHandler: (eventName: string, element: IWasabyHTMLElement) => void;

}
