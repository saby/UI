import {detection} from 'Env/Env';

import {
    WasabyEvents,
    IWasabyEventSystem,
    IEventConfig,
    SyntheticEvent,
    FastTouchEndController,
    ITouchEvent,
    SwipeController,
    LongTapController
} from 'UICommon/Events';
import {
    IWasabyHTMLElement,
    TModifyHTMLNode,
    IControlNodeEvent
} from 'UICommon/interfaces';

export default class WasabyEventsReact extends WasabyEvents implements IWasabyEventSystem {
    private lastTarget: IWasabyHTMLElement;
    private wasWasabyNotifyList: IControlNodeEvent[] = [];

    //#region инициализация системы событий
    constructor(rootNode: TModifyHTMLNode, tabKeyHandler?: Function) {
        super(rootNode, tabKeyHandler);
        this.initProcessingHandlers();
    }

    protected initProcessingHandlers(): void {
        this.addCaptureProcessingHandler('click', this._handleClick);
        this.addCaptureProcessingHandler('touchstart', this._handleTouchstart);
        this.addCaptureProcessingHandler('touchmove', this._handleTouchmove);
        this.addCaptureProcessingHandler('touchend', this._handleTouchend);
    }
    //#endregion

    //#region перехват и всплытие событий
    captureEventHandler<TNativeEvent extends Event>(
        event: TNativeEvent
    ): void {
        this.setLastTarget(event.target as IWasabyHTMLElement);
        const syntheticEvent = new SyntheticEvent(event);
        if (detection.isMobileIOS && detection.safari && event.type === 'click' && this.touchendTarget) {
            syntheticEvent.target = this.touchendTarget;
            this.touchendTarget = null;
        }
        this.vdomEventBubbling(syntheticEvent, null, undefined, [], true);
    }
    //#endregion

    //#region события тача
    protected _handleTouchstart(event: ITouchEvent): void {
        this.touchHandlers.setPreventShouldUseClickByTap(false);

        this.touchHandlers.shouldUseClickByTapOnTouchstart(event);
        // Compatibility. Touch events handling in Control.compatible looks for
        // the `addedToClickState` flag to see if the event has already been
        // processed. Since vdom has already handled this event, set this
        // flag to true to avoid event triggering twice.
        event.addedToClickState = true;

        FastTouchEndController.setClickEmulateState(true);
        SwipeController.initState(event);
        const longTapCallback = () => {
            // т.к. callbackFn вызывается асинхронно, надо передавать с правильным контекстом
            FastTouchEndController.setClickEmulateState.call(FastTouchEndController, false);
            this.touchHandlers.setPreventShouldUseClickByTap(true);
        };
        LongTapController.initState(event, longTapCallback.bind(this));
    }
    //#endregion

    //#region _notify события
    startEvent<TArguments, TControlNode>(controlNode: TControlNode & IControlNodeEvent, args: TArguments): unknown {
        let allowEventBubbling = true;
        const eventName = args[0].toLowerCase();
        const handlerArgs = args[1] || [];
        const eventDescription = args[2];
        const eventConfig: IEventConfig = {};
        let eventObject;
        eventConfig._bubbling = eventDescription && eventDescription.bubbling !== undefined ?
            eventDescription.bubbling : false;
        eventConfig.type = eventName;
        eventConfig.target = controlNode.element;

        eventObject = new SyntheticEvent(null, eventConfig);
        this.needBlockNotify = this.lastNotifyEvent === eventName;
        if (this.wasWasabyNotifyList.indexOf(controlNode.controlNodeEvent) > -1) {
            allowEventBubbling = false;
        }
        if (allowEventBubbling) {
            this.wasWasabyNotifyList.push(controlNode.controlNodeEvent);
            this.vdomEventBubbling(eventObject, controlNode, undefined, handlerArgs, false);
        }
        this.clearWasNotifyList();
        this.clearWasWasabyNotifyList();
        return eventObject.result;
    }

    private setLastTarget(target: IWasabyHTMLElement): void {
        this.lastTarget = target;
    }

    private clearWasWasabyNotifyList(): void {
        this.wasWasabyNotifyList = [];
    }
    //#endregion

    //#region регистрация событий
    protected addCaptureProcessingHandler(eventName: string, method: Function): void {
        if (this._rootDOMNode.parentNode) {
            const handler = function(e: Event): void {
                method.apply(this, arguments);
            };
            this.addHandler(eventName, false, handler, true);
        }
    }

    protected addCaptureProcessingHandlerOnEnvironment(eventName: string, method: Function): void {
        if (this._rootDOMNode.parentNode) {
            const handler = function(e: Event): void {
                method.apply(this, arguments);
            };
            this.addHandler(eventName, false, handler, true);
        }
    }
    //#endregion
}
