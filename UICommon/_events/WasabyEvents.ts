import {detection} from 'Env/Env';

import * as EventUtils from './EventUtils';
import {
    ISyntheticEvent,
    IEventConfig,
    IWasabyEventSystem,
    IHandlerInfo
} from './IEvents';

import {TouchHandlers} from './Touch/TouchHandlers';
import {FastTouchEndController} from './Touch/FastTouchEndController';
import {SwipeController} from './Touch/SwipeController';
import {LongTapController} from './Touch/LongTapController';
import {ITouchEvent} from './Touch/TouchEvents';

import {
    IWasabyHTMLElement,
    ICommonDOMEnvironment as IDOMEnvironment,
    TModifyHTMLNode,
    ICommonControlNode as IControlNode,
    IControlNodeEvent
} from 'UICommon/interfaces';

/**
 * @author Тэн В.А.
 */

abstract class WasabyEvents implements IWasabyEventSystem {
    private capturedEventHandlers: Record<string, IHandlerInfo[]>;
    protected touchendTarget: Element;

    protected wasNotifyList: string[] = [];
    protected lastNotifyEvent: string = '';
    protected needBlockNotify: boolean = false;

    protected _rootDOMNode: TModifyHTMLNode;
    private _handleTabKey: Function;

    //#region инициализация системы событий
    protected constructor(rootNode: TModifyHTMLNode, tabKeyHandler?: Function) {
        this._rootDOMNode = rootNode;
        this.capturedEventHandlers = {};
        this._handleTabKey = tabKeyHandler;

        this.initEventSystemFixes();

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
    ): void;

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
    protected abstract vdomEventBubbling<T>(
        eventObject: ISyntheticEvent,
        controlNode: T & (IControlNode | IControlNodeEvent),
        eventPropertiesStartArray: unknown[],
        args: unknown[],
        native: boolean
    ): void;

    //#endregion

    //#region специфические обработчики
    protected _handleClick(event: MouseEvent): void {
        TouchHandlers.shouldUseClickByTapOnClick(event);

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
        const hasSelection = selection &&
            selection.type === 'Range' &&
            (event.target as HTMLElement).contains(selection.focusNode);
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
        TouchHandlers.shouldUseClickByTapOnTouchmove(event);
        FastTouchEndController.setClickEmulateState(false);
        SwipeController.detectState(event);
        LongTapController.resetState();
    }

    // TODO: docs
    protected _handleTouchend(event: ITouchEvent): void {
        TouchHandlers.shouldUseClickByTapOnTouchend.call(this, event);

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
    abstract startEvent<TArguments, TControlNode>(controlNode: TControlNode, args: TArguments): unknown

    protected clearWasNotifyList(): void {
        this.wasNotifyList = [];
    }

    protected needBlockNotifyState(): boolean {
        return this.needBlockNotify;
    }

    protected setWasNotifyList(instId: string, eventType: string): void {
        this.wasNotifyList.push(`${instId}_${eventType}`);
    }

    protected wasNotified(instId: string, eventType: string): boolean {
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

    protected isArgsLengthEqual(controlNodesArgs: any, evArgs: any): boolean {
        return controlNodesArgs && controlNodesArgs.args && controlNodesArgs.args.length === evArgs.length;
    }

    protected checkControlNodeEvents(controlNode: IControlNodeEvent, eventName: string, index: number): unknown {
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
