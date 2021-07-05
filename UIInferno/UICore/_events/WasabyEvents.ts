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
    LongTapController,
    TouchHandlers,
    ISyntheticEvent
} from 'UICommon/Events';
import {
    IControlNodeEvent,
    IWasabyHTMLElement,
    TModifyHTMLNode
} from 'UICommon/interfaces';
import {
    IDOMEnvironment,
    IControlNode
} from 'UICore/interfaces';

interface IArrayEvent {
    fn: Record<string, Function>;
    finalArgs: Record<string, unknown>[];
}

const callAfterMount: IArrayEvent[] = [];
const afterMountEvent: string[] = ['mouseenter', 'mousedown'];

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
        const syntheticEvent = new SyntheticEvent(event);
        if (detection.isMobileIOS && detection.safari && event.type === 'click' && this.touchendTarget) {
            syntheticEvent.target = this.touchendTarget;
            this.touchendTarget = null;
        }
        this.vdomEventBubbling(syntheticEvent, null, undefined, [], true);
    }

    protected vdomEventBubbling<T>(
        eventObject: ISyntheticEvent,
        controlNode: T & (IControlNode | IControlNodeEvent),
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
                                // TODO: убрать проверку на тип события - сделать более универсальный метод возможно надо смотреть
                                //  на eventObject.nativeEvent или вообще для всех?
                                if (!fn.control._mounted && afterMountEvent.indexOf(eventObject.type) > -1) {
                                    /* Асинхронный _afterMount контролов приводит к тому,
                                     * что события с dom начинают стрелять до маунта,
                                     * в таком случае их надо вызвать отложено */
                                    callAfterMount.push({fn, finalArgs});
                                } else {
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

    callEventsToDOM(): void {
        while (callAfterMount && callAfterMount.length) {
            const elem = callAfterMount.shift();
            const fn = elem.fn;
            /* в слое совместимости контрол внутри которого построился wasaby-контрол, может быть уничтожен
               до того как начнется асинхронный вызов afterMount,
               как результат в текущей точку контрол будет уже уничтожен слоем совместимости
               нало проверять действительно ли он жив, перед тем как выстрелить событием
               */
            // @ts-ignore
            if (!fn.control._destroyed) {
                fn.apply(fn.control, elem.finalArgs);
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
