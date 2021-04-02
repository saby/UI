import {detection} from 'Env/Env';
import {Logger} from 'UICommon/Utils';

import * as EventUtils from './EventUtils';
import {
    ISyntheticEvent,
    IEventConfig,
    IWasabyEventSystem,
    IHandlerInfo,
    IArrayEvent
} from './IEvents';

import {TouchHandlers} from './Touch/TouchHandlers';
import {FastTouchEndController} from './Touch/FastTouchEndController';
import {SwipeController} from './Touch/SwipeController';
import {LongTapController} from './Touch/LongTapController';
import {ITouchEvent} from './Touch/TouchEvents';

import {
    IWasabyHTMLElement,
    IControlNode,
    IDOMEnvironment,
    TModifyHTMLNode
} from 'UICore/_vdom/Synchronizer/interfaces';

/**
 * @author Тэн В.А.
 */

const callAfterMount: IArrayEvent[] = [];

abstract class WasabyEvents implements IWasabyEventSystem {
    private capturedEventHandlers: Record<string, IHandlerInfo[]>;
    protected touchendTarget: Element;

    protected wasNotifyList: string[] = [];
    protected lastNotifyEvent: string = '';
    protected needBlockNotify: boolean = false;

    protected _rootDOMNode: TModifyHTMLNode;
    private _handleTabKey: Function;

    protected touchHandlers: TouchHandlers;

    //#region инициализация системы событий
    protected constructor(rootNode: TModifyHTMLNode, tabKeyHandler?: Function) {
        this._rootDOMNode = rootNode;
        this.capturedEventHandlers = {};
        this._handleTabKey = tabKeyHandler;

        this.initEventSystemFixes();
        this.touchHandlers = new TouchHandlers(this._handleClick, this.captureEventHandler);

        // если я это не напишу, ts ругнется 'touchendTarget' is declared but its value is never read
        this.touchendTarget = this.touchendTarget || null;
    }

    protected abstract initProcessingHandlers(environment?: IDOMEnvironment): void;

    private initEventSystemFixes() {
        // Edge (IE12) иногда стреляет selectstart при клике на элемент с user-select: none, и начинает
        // выделяться весь текст на странице. Причину найти не удалось, сценарий описан в ошибке:
        // https://online.sbis.ru/opendoc.html?guid=bc6d9da2-ea28-4b5d-80e1-276c3d4a0cc7
        //
        // Другие браузеры (Chrome) при клике на элементы с user-select: none такое событие не стреляют.
        // В Edge подписываемся на selectstart на фазе захвата, и если target'ом является элемент с
        // user-select: none, отменяем начало выделения через preventDefault
        if (detection.isIE12 && typeof window !== 'undefined' && typeof document !== 'undefined') {
            // Проверяем _patchedSelectStart, так как этот обработчик уже могли повесить из core-init
            // (если на странице одновременно и старые и новые компоненты)
            if (!((window as any)._patchedSelectStart)) {
                (window as any)._patchedSelectStart = true;
                document.body.addEventListener('selectstart', (e) => {
                    const styles = getComputedStyle(e.target as Element);
                    const userSelect =
                        styles.getPropertyValue('-ms-user-select') ||
                        styles.getPropertyValue('user-select');
                    if (userSelect === 'none') {
                        e.preventDefault();
                    }
                }, true);
            }
        }

    }
    //#endregion

    //#region перехват и всплытие событий
    /**
     * Точка входа в систему событий. Здесь мы перехватываем событие на фазе захвата
     * @param event - объект события
     * @param environment - окружение (необходимо для слоя совместимости)
     */
    abstract captureEventHandler<TNativeEvent extends Event>(
        event: TNativeEvent
    ): void

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

    showCapturedEventHandlers(): Record<string, IHandlerInfo[]> {
        return this.capturedEventHandlers;
    }

    /**
     * Распространение происходит по DOM-нодам вверх по родителям, с использованием массива обработчиков eventProperties,
     * в котором указаны обработчики для каждого контрола, если эти контролы подписаны на событие
     * Таким образом, обходим всю иерархию, даже если на дом-ноде висит несколько контрол-нод.
     * @param eventObject - Объект распространения
     * @param controlNode - Контрол-нода, с элемента которой начинается распространение, если это кастомное событие
     * @param eventPropertiesStartArray - массив обработчиков в массиве eventProperties у eventObject.target,
     * с которого нужно начать цепочку вызовов обработчиков события. Необходимо для того, чтобы не вызывать обработчики
     * контролов дочерних контрол-нод.
     * @param args - Аргументы, переданные в _notify
     * @param native {any} - TODO: describe function parameter
     */
    protected vdomEventBubbling(
        eventObject: ISyntheticEvent,
        controlNode: IControlNode,
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
                                if (!fn.control._mounted && eventObject.type === 'mouseenter') {
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
    //#endregion

    //#region специфические обработчики
    protected _handleClick(event: MouseEvent): void {
        this.touchHandlers.shouldUseClickByTapOnClick(event);

        /**
         * Firefox right click bug
         * https://bugzilla.mozilla.org/show_bug.cgi?id=184051
         */
        if (event.button === 2) {
            event.stopPropagation();
            return;
        }

        /**
         * Break click by select.
         */
        const selection = window && window.getSelection ? window.getSelection() : null;

        // Break click on non-empty selection with type "Range".
        // Have to trim because of fake '\n' selection in some cases.
        const hasSelection = selection && selection.type === 'Range' && (event.target as HTMLElement).contains(selection.focusNode);
        const userSelectIsNone = window && window.getComputedStyle
            ? window.getComputedStyle(event.target as HTMLElement)['user-select'] === 'none'
            : true;
        const isTargetNotEmpty = window && (event.target as HTMLElement).textContent.trim().length > 0;
        if (hasSelection && !userSelectIsNone && isTargetNotEmpty) {
            event.stopImmediatePropagation();
            return;
        }
    }

    // TODO: docs
    handleSpecialEvent(eventName: string, eventHandler: Function, environment?: IDOMEnvironment): void {
        this.addCaptureProcessingHandlerOnEnvironment(eventName, eventHandler, environment);
    }
    //#endregion

    //#region события таба
    addTabListener(): void {
        if (this._rootDOMNode) {
            this._rootDOMNode.addEventListener('keydown', this._handleTabKey as EventListener, false);
        }
    }

    removeTabListener(): void {
        if (this._rootDOMNode) {
            this._rootDOMNode.removeEventListener('keydown', this._handleTabKey as EventListener, false);
        }
    }

    //#endregion

    //#region события тача
    // TODO: docs
    protected abstract _handleTouchstart(event: ITouchEvent): void;

    // TODO: docs
    protected _handleTouchmove(event: ITouchEvent): void {
        this.touchHandlers.shouldUseClickByTapOnTouchmove(event);
        FastTouchEndController.setClickEmulateState(false);
        SwipeController.detectState(event);
        LongTapController.resetState();
    }

    // TODO: docs
    protected _handleTouchend(event: ITouchEvent): void {
        this.touchHandlers.shouldUseClickByTapOnTouchend(event);

        // Compatibility. Touch events handling in Control.compatible looks for
        // the `addedToClickState` flag to see if the event has already been
        // processed. Since vdom has already handled this event, set this
        // flag to true to avoid event triggering twice.
        event.addedToClickState = true;

        // есть ситуации когда в обработчик клика летит неправильный таргет в мобильном сафари
        // причину выяснить не удалось так что буду брать таргет из touchend
        // https://online.sbis.ru/opendoc.html?guid=a6669e05-8810-479f-8860-bc0d4f5c220e
        // https://online.sbis.ru/opendoc.html?guid=b0f15e03-3672-4be6-8a49-2758bb4c34d7
        // https://online.sbis.ru/opendoc.html?guid=f7e7811b-f093-4964-9838-0f735c97670e
        // https://online.sbis.ru/opendoc.html?guid=076215f4-2cff-4242-a3ff-70f090bfacdd
        // https://online.sbis.ru/opendoc.html?guid=79fc9323-05de-421e-b4ac-bc79ad6c775d
        // https://online.sbis.ru/opendoc.html?guid=911984fb-1757-4f62-999f-600bec2305c0
        // https://online.sbis.ru/opendoc.html?guid=f0695304-83e2-4cc5-b0b3-a63580214bf2
        // https://online.sbis.ru/opendoc.html?guid=99861178-2bd8-40dc-8307-bda1080a91f5
        this.touchendTarget = event.target as Element;
        setTimeout(() => {
            this.touchendTarget = null;
        }, 300);
        FastTouchEndController.clickEmulate(event.target as Element, event);
        SwipeController.resetState();
        LongTapController.resetState();
    }

    //#endregion

    //#region _notify события
    /**
     * Создается объект кастомного события с указанными в notify параметрами и вызывается функция его распространения
     * Возвращает результат выполнения последнего обработчика
     * @param controlNode
     * @param args
     */
    abstract startEvent<TArguments>(controlNode: IControlNode, args: TArguments): unknown

    protected clearWasNotifyList(): void {
        this.wasNotifyList = [];
    }

    private needBlockNotifyState(): boolean {
        return this.needBlockNotify;
    }

    private setWasNotifyList(instId: string, eventType: string): void {
        this.wasNotifyList.push(`${instId}_${eventType}`);
    }

    private wasNotified(instId: string, eventType: string): boolean {
        return this.wasNotifyList.indexOf(`${instId}_${eventType}`) !== -1;
    }
    //#endregion

    //#region регистрация событий
    addCaptureEventHandler(eventName: string, element: HTMLElement): void {
        // В IE в слое совместимости дикая асинхронность,
        // что приводит к тому, что подписка начинает вызываться для компонентов,
        // которые уже удалены из ДОМА механизмами CompoundControl
        if (this._rootDOMNode.parentNode) {
            this.addHandler(eventName, this.isBodyElement(element), this.captureEventHandler, false);
        }
    }

    protected abstract addCaptureProcessingHandler(
        eventName: string,
        method: Function,
        environment: IDOMEnvironment): void

    protected abstract addCaptureProcessingHandlerOnEnvironment(
        eventName: string,
        method: Function,
        environment: IDOMEnvironment): void

    /**
     * Добавление обработчика на фазу захвата.
     * Для системы событий есть два вида обработчиков на фазу захвата:
     * 1. Обработчик, который добавили просто потому,
     * что кто-то подписался на такое событие через on:eventName="handler()".
     * Такие обработчики помечаем как processingHandler:false.
     * 2. Обработчик, который мы добавляем в конструкторе DOMEnvironment. Такие обработчики нужны,
     * потому что некоторые события необходимо обработать в самой системе событий, а не в контроле.
     * Например, события touchmove, touchstart и touchend. Их необходимо обработать, потому что система событий wasaby
     * умеет распознавать два других типа тач-событий: longtap и swipe. Для таких событий processingHandler:true
     * @param {string} eventName - имя событий
     * @param {boolean} isBodyElement - TODO: describe function parameter
     * @param {Function} handler - функция обработчик
     * @param {boolean} processingHandler - необходим ли этот обработчик
     *  для самой системы событий, или же только для контролов.
     *  Будет true, если необходим для системы событий.
     */
    protected addHandler(eventName: string, isBodyElement: boolean, handler: EventListener, processingHandler: boolean): void {
        let elementToSubscribe = this._rootDOMNode.parentNode as HTMLElement;
        let bodyEvent = false;
        if (isBodyElement && EventUtils.isSpecialBodyEvent(eventName)) {
            elementToSubscribe = this.__getWindowObject();
            bodyEvent = true;
        }
        const nativeEventName = EventUtils.fixUppercaseDOMEventName(eventName);
        const handlers = this.capturedEventHandlers;
        const handlerInfo = this.getHandlerInfo(eventName, processingHandler, bodyEvent);
        if (handlerInfo === null) {
            let listenerCfg: IEventConfig = {capture: true};
            const newHandlerInfo: IHandlerInfo = {handler, bodyEvent: false, processingHandler, count: 0};
            listenerCfg = this.fixPassiveEventConfig(eventName, listenerCfg);
            newHandlerInfo.bodyEvent = bodyEvent;
            if (!processingHandler) {
                newHandlerInfo.count = 1;
            }
            if (!handlers[eventName]) {
                handlers[eventName] = [];
            }
            handlers[eventName].push(newHandlerInfo);
            const bindedHandler = function(e: Event): void {
                handler.apply(this, arguments);
            }.bind(this);
            this.addNativeListener(elementToSubscribe, bindedHandler, nativeEventName, listenerCfg);
        } else {
            if (!handlerInfo.processingHandler) {
                handlerInfo.count++;
            }
        }
    }

    private addNativeListener(element: HTMLElement, handler: EventListener, eventName: string, config: IEventConfig): void {
        element.addEventListener(eventName, handler, config);
    }

    //#endregion

    //#region удаление событий
    removeCaptureEventHandler(eventName: string, element: IWasabyHTMLElement): void {
        // TODO раскомментить после https://online.sbis.ru/opendoc.html?guid=450170bd-6322-4c3c-b6bd-3520ce3cba8a
        // Сейчас есть проблемы с вызовом ref-ов. Рефы на удаление событий вызываются большее количество раз,
        // чем на добавление событий. Это приводит к тому, что обработчики на capture-фазу могут удаляться,
        // когда еще есть активные подписки на события. Поэтому мы будем удалять обработчики на capture-фазу
        // только при дестрое самого DOMEnvironment. Последствиями такого решения будет то, что в редких случаях,
        // система событий будет распространять событие по DOM-у, несмотря на то, что мы заведомо знаем,
        // что обработчиков там не будет. Это менее критично, чем неработающие обработчики.
        // if (this._rootDOMNode.parentNode) {
        //    this.removeHandler(eventName, isBodyElement(element), false);
        // }
    }

    // TODO раскомментить после https://online.sbis.ru/opendoc.html?guid=450170bd-6322-4c3c-b6bd-3520ce3cba8a
    removeProcessiingEventHandler(eventName: string): any {
        if (this._rootDOMNode.parentNode) {
            this.removeHandler(eventName, false, true);
        }
    }

    /**
     * Удаление обработчика на фазу захвата
     * @param {string} eventName - имя события
     * @param {boolean} isBodyElement - TODO: describe function parameter
     * @param {boolean} processingHandler - необходим ли этот обработчик
     *  для самой системы событий, или же только для контролов.
     * Будет true, если необходим для системы событий.
     */
    private removeHandler(eventName: string, isBodyElement: boolean, processingHandler: boolean = false): void {
        let elementToSubscribe;
        let bodyEvent;
        if (isBodyElement && EventUtils.isSpecialBodyEvent(eventName)) {
            elementToSubscribe = this.__getWindowObject();
            bodyEvent = true;
        } else {
            elementToSubscribe = this._rootDOMNode.parentNode;
            bodyEvent = false;
        }
        const nativeEventName = EventUtils.fixUppercaseDOMEventName(eventName);
        const handlers = this.capturedEventHandlers;
        const handlerInfo = this.getHandlerInfo(eventName, processingHandler, bodyEvent);
        if (handlerInfo !== null) {
            if (!handlerInfo.processingHandler) {
                if (handlerInfo.count === 1) {
                    this.removeNativeListener(elementToSubscribe, handlerInfo.handler, nativeEventName, true);
                    handlers[eventName].splice(handlers[eventName].indexOf(handlerInfo), 1);
                } else {
                    handlerInfo.count--;
                }
            } else if (processingHandler) {
                this.removeNativeListener(elementToSubscribe, handlerInfo.handler, nativeEventName, true);
                handlers[eventName].splice(handlers[eventName].indexOf(handlerInfo), 1);
            }
        }
    }

    private removeNativeListener(
        element: Node | Window,
        handler: EventListener,
        eventName: string,
        capture: boolean = false
    ): void {
        element.removeEventListener(eventName, handler, capture);
    }

    private removeAllCaptureHandlers(): void {
        if (!this._rootDOMNode.parentNode) {
            return;
        }
        const handlers = this.capturedEventHandlers;
        for (const key in handlers) {
            if (handlers.hasOwnProperty(key)) {
                for (let i = 0; i < handlers[key].length; i++) {
                    if (handlers[key][i].bodyEvent) {
                        this.removeNativeListener(window, handlers[key][i].handler, key, true);
                    } else {
                        this.removeNativeListener(this._rootDOMNode.parentNode, handlers[key][i].handler, key, true);
                    }
                }
            }
        }
    }

    //#endregion

    //#region хэлперы
    private __getWindowObject(): HTMLElement {
        return window as unknown as HTMLElement;
    }

    private isArgsLengthEqual(controlNodesArgs: any, evArgs: any): boolean {
        return controlNodesArgs && controlNodesArgs.args && controlNodesArgs.args.length === evArgs.length;
    }

    private checkControlNodeEvents(controlNode: IControlNode, eventName: string, index: number): unknown {
        return controlNode && controlNode.events && controlNode.events[eventName] && controlNode.events[eventName][index];
    }

    /**
     * Определяем кейс, в котором нужно подписаться именно на window.
     * @param {HTMLElement} element - элемент, у которого мы хотим обработать событие
     * @returns {boolean}
     */
    private isBodyElement(element: HTMLElement): boolean {
        return element && element.tagName === 'BODY';
    }

    private getHandlerInfo(eventName: string, processingHandler: boolean, bodyEvent: boolean): IHandlerInfo {
        const handlers = this.capturedEventHandlers;
        if (handlers[eventName]) {
            for (let i = 0; i < handlers[eventName].length; i++) {
                if (handlers[eventName][i].processingHandler === processingHandler &&
                    handlers[eventName][i].bodyEvent === bodyEvent) {
                    return handlers[eventName][i];
                }
            }
        }
        return null;
    }

    /**
     * Определяем случаи, в которых нужно явно выставлять параметр passive: false в конфиге нативного обработчика события
     * @param {string} eventName - имя события, которое хотим обработать
     * @param config - конфиг, в который добавится поле passive, если нужно.
     * @returns {any}
     */
    private fixPassiveEventConfig(eventName: string, config: IEventConfig): IEventConfig {
        if (EventUtils.checkPassiveFalseEvents(eventName)) {
            config.passive = false;
        }
        return config;
    }

    //#endregion

    destroy(): void {
        this.removeTabListener();
        // TODO раскомментить после https://online.sbis.ru/opendoc.html?guid=450170bd-6322-4c3c-b6bd-3520ce3cba8a
        // this.removeProcessiingEventHandler('focus');
        // this.removeProcessiingEventHandler('blur');
        // this.removeProcessiingEventHandler('mousedown');
        // this.removeProcessiingEventHandler('click');
        // this.removeProcessiingEventHandler('touchstart');
        // this.removeProcessiingEventHandler('touchmove');
        // this.removeProcessiingEventHandler('touchend');
        this.removeAllCaptureHandlers();
        this.capturedEventHandlers = {};
        this._handleTabKey = undefined;
    }
}

export default WasabyEvents;
