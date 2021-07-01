import {cookie, detection} from 'Env/Env';

import {
    WasabyEvents,
    IWasabyEventSystem,
    IEventConfig,
    SyntheticEvent,
    FastTouchEndController,
    ITouchEvent,
    SwipeController,
    LongTapController,
    IWasabyEvent,
    EventUtils,
    TouchHandlers, ISyntheticEvent
} from 'UICommon/Events';
import {
    IWasabyHTMLElement,
    TModifyHTMLNode,
    IControlNodeEvent
} from 'UICommon/interfaces';
import { WasabyEventsDebug } from './WasabyEventsDebug';
import { Control } from 'UICore/Control';
import { Set } from 'Types/shim';
import {Logger} from '../../../UICommon/Utils';

type TElement =  HTMLElement & {
    eventProperties?: Record<string, IWasabyEvent[]>;
    eventPropertiesCnt?: number;
};
type TWasabyInputElement = HTMLInputElement & IWasabyHTMLElement;

const inputTagNames = new Set([
    'input',
    'INPUT',
    'textarea',
    'TEXTAREA'
]);

/**
 * @author Тэн В.А.
 */
export default class WasabyEventsReact extends WasabyEvents implements IWasabyEventSystem {
    private lastTarget: IWasabyHTMLElement;

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

    protected vdomEventBubbling<T>(
        eventObject: ISyntheticEvent,
        controlNode: T & IControlNodeEvent,
        eventPropertiesStartArray: unknown[],
        args: unknown[],
        native: boolean
    ): void {
        let eventProperties;
        let stopPropagation = false;
        const eventPropertyName = 'on:' + eventObject.type.toLowerCase();
        let curDomNode;
        let fn;
        let evArgs;
        let templateArgs;
        let finalArgs = [];

        // Если событием стрельнул window или document, то распространение начинаем с body
        if (native) {
            curDomNode =
                eventObject.target === window || eventObject.target === document ? document.body : eventObject.target;
        } else {
            curDomNode = controlNode.element;
        }
        curDomNode = native ? curDomNode : controlNode.element;

        // Цикл, в котором поднимаемся по DOM-нодам
        while (!stopPropagation) {
            eventProperties = curDomNode.eventProperties;
            if (eventProperties && eventProperties[eventPropertyName]) {
                // Вызываем обработчики для всех controlNode на этой DOM-ноде
                const eventProperty = eventPropertiesStartArray || eventProperties[eventPropertyName];
                for (let i = 0; i < eventProperty.length && !stopPropagation; i++) {
                    fn = eventProperty[i].fn;
                    evArgs = eventProperty[i].args || [];
                    // If controlNode has event properties on it, we have to update args, because of the clos
                    // happens in template function
                    templateArgs =
                        this.isArgsLengthEqual(this.checkControlNodeEvents(controlNode, eventPropertyName, i), evArgs)
                            ? controlNode.events[eventPropertyName][i].args : evArgs;
                    try {
                        if (!args.concat) {
                            throw new Error(
                                'Аргументы обработчика события ' + eventPropertyName.slice(3) + ' должны быть массивом.'
                            );
                        }
                        /* Составляем массив аргументов для обаботчика. Первым аргументом будет объект события.
                         Затем будут аргументы, переданные в обработчик в шаблоне, и последними - аргументы в _notify */
                        finalArgs = [eventObject];
                        Array.prototype.push.apply(finalArgs, templateArgs);
                        Array.prototype.push.apply(finalArgs, args);
                        // Добавляем в eventObject поле со ссылкой DOM-элемент, чей обработчик вызываем
                        eventObject.currentTarget = curDomNode;

                        /* Контрол может быть уничтожен, пока его дочернии элементы нотифаят асинхронные события,
                           в таком случае не реагируем на события */
                        /* Также игнорируем обработчики контрола, который выпустил событие.
                         * То есть, сам на себя мы не должны реагировать
                         * */
                        if (!fn.control._destroyed && (!controlNode || fn.control !== controlNode.control)) {
                            try {
                                let needCallHandler = native;
                                if (!needCallHandler) {
                                    needCallHandler = !this.wasNotified(fn.control._instId, eventObject.type);
                                    if (needCallHandler && this.needBlockNotifyState() && eventObject.type.indexOf('mouse') === -1) {
                                        this.setWasNotifyList(fn.control._instId, eventObject.type);
                                    }
                                }

                                if (needCallHandler) {
                                    fn.apply(fn.control, finalArgs); // Вызываем функцию из eventProperties
                                }
                            } catch (err) {
                                // в шаблоне могут указать неверное имя обработчика, следует выводить адекватную ошибку
                                Logger.error(`Ошибка при вызове обработчика "${eventPropertyName}" из контрола ${fn.control._moduleName}.
                         ${err.message}`, fn.control);
                            }
                        }
                        /* для событий click отменяем стандартное поведение, если контрол уже задестроен.
                         * актуально для ссылок, когда основное действие делать в mousedown, а он
                         * срабатывает быстрее click'а. Поэтому контрол может быть уже задестроен
                         */
                        if (fn.control._destroyed && eventObject.type === 'click') {
                            eventObject.preventDefault();
                        }
                        /* Проверяем, нужно ли дальше распространять событие по controlNodes */
                        if (!eventObject.propagating()) {
                            const needCallNext =
                                !eventObject.isStopped() &&
                                eventProperty[i + 1] &&
                                // при деактивации контролов надо учитывать что событие может распространятся с partial
                                // если не далать такую проверку то подписка on:deactivated на родителе partial не будет работать
                                ((eventObject.type === 'deactivated' && eventProperty[i].toPartial) ||
                                    eventProperty[i + 1].toPartial ||
                                    eventProperty[i + 1].fn.controlDestination === eventProperty[i].fn.controlDestination);
                            /* Если подписались на события из HOC'a, и одновременно подписались на контент хока, то прекращать
                             распространение не нужно.
                              Пример sync-tests/vdomEvents/hocContent/hocContent */
                            if (!needCallNext) {
                                stopPropagation = true;
                            }
                        }
                    } catch (errorInfo) {
                        let msg = `Event handle: "${eventObject.type}"`;
                        let errorPoint;

                        if (!fn.control) {
                            if (typeof window !== 'undefined') {
                                errorPoint = fn;
                                msg += '; Error calculating the logical parent for the function';
                            } else {
                                errorPoint = curDomNode;
                            }
                        } else {
                            errorPoint = fn.control;
                        }
                        Logger.error(msg, errorPoint, errorInfo);
                    }
                }
            }
            // TODO Remove when compatible is removed
            if (curDomNode.compatibleNotifier && controlNode && controlNode.element !== curDomNode) {
                const res = curDomNode.compatibleNotifier.notifyVdomEvent(
                    eventObject.type,
                    args,
                    controlNode && controlNode.control
                );
                if (!eventObject.hasOwnProperty('result')) {
                    eventObject.result = res;
                }
            }
            curDomNode = curDomNode.parentNode;
            if (curDomNode === null || curDomNode === undefined || !eventObject.propagating()) {
                stopPropagation = true;
            }
            if (eventPropertiesStartArray !== undefined) {
                eventPropertiesStartArray = undefined;
            }
        }
    }

    //#endregion

    //#region события тача
    protected _handleTouchstart(event: ITouchEvent): void {
        TouchHandlers.setPreventShouldUseClickByTap(false);

        TouchHandlers.shouldUseClickByTapOnTouchstart(event);
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
            TouchHandlers.setPreventShouldUseClickByTap(true);
        };
        LongTapController.initState(event, longTapCallback.bind(this));
    }
    //#endregion

    //#region _notify события
    startEvent<TArguments, TControlNode>(controlNode: TControlNode & IControlNodeEvent, args: TArguments): unknown {
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
        this.vdomEventBubbling(eventObject, controlNode, undefined, handlerArgs, false);

        this.clearWasNotifyList();
        return eventObject.result;
    }

    private setLastTarget(target: IWasabyHTMLElement): void {
        this.lastTarget = target;
    }
    //#endregion

    //#region регистрация событий
    setEventHook(
        tagName: string,
        props: {
            events: Record<string, IWasabyEvent[]>;
        },
        element: TElement | Control
    ): void {
        const domElement = element._container || element;
        const events = props.events;
        const eventSystem = WasabyEventsReact.getInstance();
        this.prepareEvents(events);
        if (!this.haveEvents(events)) {
            return;
        }
        const origEventProperties = domElement.eventProperties || {};
        domElement.eventProperties = events;
        if (!this.findEventProperties(events, origEventProperties)) {
            domElement.eventProperties = WasabyEventsReact.mergeEvents(origEventProperties, events);
        }
        if (!!domElement) {
            this.addEventsToElement(events, eventSystem, domElement);
        }
        if (!domElement) {
            this.clearInputValue(domElement);
        }
    }

    private prepareEvents(events: Record<string, IWasabyEvent[]>): void {
        Object.keys(events).forEach((eventName) => {
            const eventArr = events[eventName];
            eventArr.forEach((event: IWasabyEvent) => {
                if (event.args) {
                    event.fn = function (eventObj: SyntheticEvent): void {
                        const context = event.context.apply(this.viewController);
                        const handler = event.handler.apply(this.viewController);
                        if (typeof handler === 'undefined') {
                            throw new Error(`Отсутствует обработчик ${ event.value } события ${ eventObj.type } у контрола ${ event.viewController._moduleName }`);
                        }
                        context.eventTarget = eventObj.target;
                        const res = handler.apply(context, arguments);
                        if(res !== undefined) {
                            eventObj.result = res;
                        }
                    };
                } else {
                    event.fn = function (eventObj: SyntheticEvent, value: unknown): void {
                        if (!event.handler(this.viewController, value)) {
                            event.handler(this.data, value);
                        }
                    };
                }

                event.fn = event.fn.bind({
                    viewController: event.viewController,
                    data: event.data
                });
                event.fn.control = event.viewController;
            });
        });
    }

    private addEventsToElement(
        events: Record<string, IWasabyEvent[]>,
        eventSystem: IWasabyEventSystem,
        element: TElement
    ): void {
        if (!element.eventProperties) {
            element.eventProperties = {};
            element.eventPropertiesCnt = 0;
        }
        const eventProperties: Record<string, IWasabyEvent[]> = element.eventProperties;

        const eventFullNamesNames: string[] = Object.keys(events);
        for (let i = 0; i < eventFullNamesNames.length; i++) {
            const eventFullName: string = eventFullNamesNames[i];
            const eventValue: IWasabyEvent[] = events[eventFullName];
            const eventName = EventUtils.getEventName(eventFullName);
            let eventDescrArray: IWasabyEvent[] = eventValue.map((event: IWasabyEvent): IWasabyEvent => {
                return event;
            });
            if (eventProperties[eventFullName]) {
                const elementEvents = this.eventDescrAttach(eventProperties[eventFullName], eventDescrArray);
                if (eventProperties[eventFullName] && elementEvents.length === 0) {
                    eventDescrArray = eventDescrArray.concat(eventProperties[eventFullName]);
                }
            } else {
                element.eventPropertiesCnt++;
            }

            eventProperties[eventFullName] = eventDescrArray;
            eventSystem.addCaptureEventHandler(eventName, element);
        }
    }

    private findEventProperties(
        newEvents: Record<string, IWasabyEvent[]>,
        eventProperties: Record<string, IWasabyEvent[]>
    ): boolean {
        const newEventsKey = Object.keys(newEvents);
        const eventPropertiesKey  = Object.keys(eventProperties);

        if (newEventsKey.length !== eventPropertiesKey.length) {
            return false;
        }

        for (const key of newEventsKey) {
            if (!eventProperties.hasOwnProperty(key)) {
                return false;
            }
        }

        return true;
    }

    private isInputElement(element: HTMLElement): element is TWasabyInputElement {
        return inputTagNames.has(element.tagName);
    }

    private clearInputValue(element: HTMLElement & {value?: unknown}): void {
        if (element && this.isInputElement(element)) {
            delete element.value;
        }
    }

    private haveEvents(events: Record<string, IWasabyEvent[]>): boolean {
        return events && Object.keys(events).length > 0;
    }

    private eventDescrAttach(elementEvents: IWasabyEvent[], eventDescriptionArray: IWasabyEvent[]): IWasabyEvent[] {
        const eventDescriptionFirstValue = eventDescriptionArray[0] && eventDescriptionArray[0].value;
        return elementEvents.filter((event) => eventDescriptionFirstValue === event.value);
    }

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

    private static eventSystem: WasabyEventsReact;
    static initInstance(domElement: HTMLElement): WasabyEventsReact {
        if (!WasabyEventsReact.eventSystem) {
            WasabyEventsDebug.debugEnable = WasabyEventsDebug.debugEnable || cookie.get('eventSystemDebug');
            WasabyEventsReact.eventSystem = new WasabyEventsReact(domElement);
        }
        return WasabyEventsReact.eventSystem;
    }

    static getInstance(node?: HTMLElement): WasabyEventsReact {
        if (!WasabyEventsReact.eventSystem) {
            WasabyEventsReact.initInstance(node);
        }
        return WasabyEventsReact.eventSystem;
    }


    static mergeEvents(
        currentEvents: Record<string, IWasabyEvent[]>,
        newEvents: Record<string, IWasabyEvent[]>
    ): Record<string, IWasabyEvent[]> {
        const mergedEvents = currentEvents;
        const newEventsKeys = Object.keys(newEvents);

        for (const key of newEventsKeys) {
            if (!currentEvents.hasOwnProperty(key)) {
                mergedEvents[key] = newEvents[key];
            }
        }
        return mergedEvents;
    }
}
