import {detection} from 'Env/Env';
import {Logger} from 'UICommon/Utils';

import {
    WasabyEvents,
    IWasabyEventSystem,
    IEventConfig,
    SyntheticEvent,
    isInvisibleNode,
    FastTouchEndController,
    ITouchEvent,
    IFixedEvent,
    SwipeController,
    LongTapController
} from 'UICommon/Events';
import {
    IWasabyHTMLElement,
    TModifyHTMLNode
} from 'UICommon/interfaces';
import {
    IDOMEnvironment,
   IControlNode
} from 'UICore/interfaces';

export default class WasabyEventsInferno extends WasabyEvents implements IWasabyEventSystem {
    private _environment: IDOMEnvironment;

    constructor(rootNode: TModifyHTMLNode, environment: IDOMEnvironment, tabKeyHandler?: Function) {
        super(rootNode, tabKeyHandler);
        this.setEnvironment(environment);
        this.initProcessingHandlers(environment);
    }

    protected initProcessingHandlers(environment: IDOMEnvironment): void {
        this.addCaptureProcessingHandler('click', this._handleClick, environment);
        this.addCaptureProcessingHandler('touchstart', this._handleTouchstart, environment);
        this.addCaptureProcessingHandler('touchmove', this._handleTouchmove, environment);
        this.addCaptureProcessingHandler('touchend', this._handleTouchend, environment);
    }

    private setEnvironment(environment: IDOMEnvironment): void {
        this._environment = environment;
    }

    //#region перехват и всплытие событий
    captureEventHandler<TNativeEvent extends Event>(
        event: TNativeEvent
    ): void {
        //@ts-ignore https://online.sbis.ru/opendoc.html?guid=8866baa5-2b6f-4c42-875d-863effd4f12e
        // нативная система событий react и wasaby конфликтуют, т.к. среди обработчиков может быть такой
        // который вызывает stopPropagation, что останавливает нативное событие.
        // в таком случае нативное событие не перехватится реактом и обработчик не будет вызван
        if (event.isThirdPartyEvent) {
            return;
        }
        if (this.needPropagateEvent(this._environment, event)) {
            const syntheticEvent = new SyntheticEvent(event);
            if (detection.isMobileIOS && detection.safari && event.type === 'click' && this.touchendTarget) {
                syntheticEvent.target = this.touchendTarget;
                this.touchendTarget = null;
            }
            this.vdomEventBubbling(syntheticEvent, null, undefined, [], true);
        }
    }

    private needPropagateEvent(environment: IDOMEnvironment, event: IFixedEvent): boolean {
        if (!environment._rootDOMNode) {
            return false;
        } else if (
            !(
                (event.currentTarget === window && event.type === 'scroll') ||
                (event.currentTarget === window && event.type === 'resize')
            ) && event.eventPhase !== 1
        ) {
            // У событий scroll и resize нет capture-фазы,
            // поэтому учитываем их в условии проверки на фазу распространения события
            return false;
        } else if (
            detection.isIE &&
            event.type === 'change' &&
            !event._dispatchedForIE &&
            this.needStopChangeEventForEdge(event.target)
        ) {
            // Из-за особенностей работы vdom в edge событие change у некоторых типов input'ов стреляет не всегда.
            // Поэтому для этих типов мы будем стрелять событием сами.
            // И чтобы обработчики событий не были вызваны два раза, стопаем нативное событие.
            return false;
        } else if (detection.isMobileIOS &&
           FastTouchEndController.isFastEventFired(event.type) &&
           FastTouchEndController.wasEventEmulated() &&
           event.isTrusted) {
            // на ios 14.4 после событий тача стреляет дополнительный mousedown с isTrusted = true
            // это связанно с тем, что мы пытаемся игнорировать нативную задержку в 300 мс
            // поэтому для событий которые мы выстрелим руками повторный вызов не нужен
            return false;
        } else if (!isMyDOMEnvironment(environment, event)) {
            return false;
        }

        return true;
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
        LongTapController.initState(event, longTapCallback.bind(this._environment));
    }
    //#endregion

    //#region _notify события
    startEvent<TArguments, TControlNode>(controlNode: TControlNode & IControlNode, args: TArguments): unknown {
        const eventName = args[0].toLowerCase();
        const handlerArgs = args[1] || [];
        const eventDescription = args[2];
        const eventConfig: IEventConfig = {};
        let eventObject;
        eventConfig._bubbling = eventDescription && eventDescription.bubbling !== undefined ?
            eventDescription.bubbling : false;
        eventConfig.type = eventName;
        eventConfig.target = controlNode.element;
        if (!eventConfig.target) {
            if (
                controlNode.fullMarkup.moduleName !== 'UI/_executor/_Expressions/RawMarkupNode' &&
                !isInvisibleNode(controlNode, true)
            ) {
                Logger.error('Событие ' + eventName + ' было вызвано до монтирования контрола в DOM', controlNode);
            }
            return;
        }
        const startArray = this.getEventPropertiesStartArray(controlNode, eventName);

        eventObject = new SyntheticEvent(null, eventConfig);
        this.needBlockNotify = this.lastNotifyEvent === eventName;
        this.vdomEventBubbling(eventObject, controlNode, startArray, handlerArgs, false);
        this.clearWasNotifyList();
        return eventObject.result;
    }
    //#endregion

    //#region хэлперы
    private needStopChangeEventForEdge(node: any): boolean {
        return node.type === 'text' || node.type === 'password';
    }

    /**
     * Находит массив обработчиков в массиве eventProperties у controlNode.element, которые будут вызваны
     * @param controlNode
     * @param eventName
     * @returns {number}
     */
    private getEventPropertiesStartArray(controlNode: IControlNode, eventName: string): any {
        const eventProperties = controlNode.element.eventProperties;
        const controlNodes = controlNode.element.controlNodes;
        const eventPropertyName = 'on:' + eventName;
        const result = [];

        if (eventProperties && eventProperties[eventPropertyName]) {
            const eventProperty = eventProperties[eventPropertyName];

            // найдем индекс controlNode распространяющего событие
            const startControlNodeIndex = controlNodes.findIndex(
                (cn: IControlNode): boolean => cn.control === controlNode.control
            );

            const foundHandlers = eventProperty.map((eventHandler: any): any => {
                const foundIndex = controlNodes.findIndex(
                    (controlNode: IControlNode): boolean => controlNode.control === eventHandler.fn.control
                );
                return {
                    index: foundIndex,
                    eventHandler
                };
            });

            foundHandlers.forEach((handler: any): void => {
                if (handler.index === -1 || handler.index > startControlNodeIndex) {
                    result.push(handler.eventHandler);
                }
            });
        }
        return result;
    }
    //#endregion

    //#region регистрация событий
    protected addCaptureProcessingHandler(eventName: string, method: Function, environment: IDOMEnvironment): void {
        if (this._rootDOMNode.parentNode) {
            const handler = function(e: Event): void {
                if (!isMyDOMEnvironment(environment, e)) {
                    return;
                }
                method.apply(this, arguments);
            };
            this.addHandler(eventName, false, handler, true);
        }
    }

    protected addCaptureProcessingHandlerOnEnvironment(eventName: string, method: Function, environment: IDOMEnvironment): void {
        if (this._rootDOMNode.parentNode) {
            const handler = function(e: Event): void {
                if (!isMyDOMEnvironment(environment, e)) {
                    return;
                }
                method.apply(environment, arguments);
            };
            this.addHandler(eventName, false, handler, true);
        }
    }
    //#endregion
}

/*
  * Checks if event.target is a child of current DOMEnvironment
  * @param env
  * @param event
  */
function isMyDOMEnvironment(env: IDOMEnvironment, event: Event): boolean {
    let element = event.target as any;
    if (element === window || element === document) {
        return true;
    }
    const isCompatibleTemplate = requirejs.defined('OnlineSbisRu/CompatibleTemplate');
    while (element) {
        // для страниц с CompatibleTemplate вся обработка в checkSameEnvironment
        if (element === env._rootDOMNode && !isCompatibleTemplate) {
            return true;
        }
        // встретили controlNode - нужно принять решение
        if (element.controlNodes && element.controlNodes[0]) {
            return checkSameEnvironment(env, element, isCompatibleTemplate);
        }
        if (element === document.body) {
            element = document.documentElement;
        } else if (element === document.documentElement) {
            element = document;
        } else {
            element = element.parentNode;
        }
    }
    return false;
}

function checkSameEnvironment(env: IDOMEnvironment, element: IWasabyHTMLElement, isCompatibleTemplate: boolean): boolean {
    // todo костыльное решение, в случае CompatibleTemplate нужно всегда работать с верхним окружением (которое на html)
    // на ws3 страницах, переведенных на wasaby-окружение при быстром открытие/закртые окон не успевается полностью
    // задестроится окружение (очищается пурификатором через 10 сек), поэтому следует проверить env на destroy
    // @ts-ignore
    if (isCompatibleTemplate && !env._destroyed) {
        const htmlEnv = env._rootDOMNode.tagName.toLowerCase() === 'html';
        if (element.controlNodes[0].environment === env && !htmlEnv) {
            // FIXME: 1. проблема в том, что обработчики событий могут быть только на внутреннем окружении,
            // в таком случае мы должны вызвать его с внутреннего окружения.
            // FIXME: 2. обработчик может быть на двух окружениях, будем определять где он есть и стрелять
            // с внутреннего окружения, если обработчика нет на внешнем
            let hasHandlerOnEnv = false;
            let eventIndex;
            // проверяем обработчики на внутреннем окружении
            // если processingHandler === false, значит подписка была через on:event
            let currentCaptureEvent = env.showCapturedEvents()[event.type];
            for (eventIndex = 0; eventIndex < currentCaptureEvent.length; eventIndex++) {
                // нашли подписку через on:, пометим, что что на внутреннем окружении есть подходящий обработчик
                if (!currentCaptureEvent[eventIndex].processingHandler) {
                    hasHandlerOnEnv = true;
                }
            }
            // Если обработчика на внутреннем окружении то ничего дальше не делаем
            if (!hasHandlerOnEnv) {
                return hasHandlerOnEnv;
            }
            // Следует определить есть ли обработчики на внешнем окружении
            let _element: any = element;
            while (_element.parentNode) {
                _element = _element.parentNode;
                // проверяем на наличие controlNodes на dom-элементе
                if (_element.controlNodes && _element.controlNodes[0]) {
                    // нашли самое верхнее окружение
                    if (_element.controlNodes[0].environment._rootDOMNode.tagName.toLowerCase() === 'html') {
                        // проверяем, что такой обработчик есть
                        if (typeof _element.controlNodes[0].environment.showCapturedEvents()[event.type] !== 'undefined') {
                            // обработчик есть на двух окружениях. Следует проанализировать обработчики на обоих окружениях
                            currentCaptureEvent = _element.controlNodes[0].environment.showCapturedEvents()[event.type];
                            let hasHandlerOnTopEnv = false;
                            // проверяем обработчики на внешнем окружении
                            for (eventIndex = 0; eventIndex < currentCaptureEvent.length; eventIndex++) {
                                // нашли подписку через on:, пометим, что что на внешнем окружении есть подходящий обработчик
                                if (!currentCaptureEvent[eventIndex].processingHandler) {
                                    hasHandlerOnTopEnv = true;
                                }
                            }
                            // если обработчик есть на двух окружениях, то ничего не делаем
                            return !hasHandlerOnTopEnv && hasHandlerOnEnv;
                        }
                        return hasHandlerOnEnv;
                    }
                }
            }
        }
        return htmlEnv;
    }
    return element.controlNodes[0].environment === env;
}
