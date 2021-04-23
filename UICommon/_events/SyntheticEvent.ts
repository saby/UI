import { ISyntheticEvent, IEventConfig } from './IEvents';

/**
 * Перехватываем события дома на этапе всплытия и поэтому далее сами
 * должны правильно распространить их
 * Некоторые события не всплывают (флаги взяты из документации)
 * */
var domEventsBubbling = {
    animationend: true,
    blur: false,
    error: false,
    focus: false,
    load: false,
    mouseenter: false,
    mouseleave: false,
    resize: false,
    scroll: false,
    unload: false,
    click: true,
    change: true,
    compositionend: true,
    compositionstart: true,
    compositionupdate: true,
    copy: true,
    cut: true,
    paste: true,
    dblclick: true,
    focusin: true,
    focusout: true,
    input: true,
    keydown: true,
    keypress: true,
    keyup: true,
    mousedown: true,
    mousemove: true,
    mouseout: true,
    mouseover: true,
    mouseup: true,
    select: true,
    wheel: true,
    touchstart: true,
    touchend: true,
    touchmove: true,
    contextmenu: true,
    swipe: true,
    longtap: true
};

/**
 * Класс искуссвенных событий Wasaby.
 * @class UICommon/_events/SyntheticEvent
 * @author Тэн В.А.
 * @remark <a href="/doc/platform/developmentapl/interface-development/ui-library/events/">Работа с событиями</a>
 * @public
 */
export default class SyntheticEvent<TNativeEvent extends Event = Event> implements ISyntheticEvent {
    /**
     * Нативное событие, генерируемое пользователем или API
     */
    nativeEvent: TNativeEvent;

    /**
     * Название события
     */
    type: string;

    /**
     * Объект на котором произошло событие
     */
    target: EventTarget;

    /**
     * Объект на котором обрабатывается событие
     */
    currentTarget: EventTarget;

    private stopped: boolean;
    private _bubbling: boolean;

    constructor(nativeEvent: TNativeEvent, eventConfig?: IEventConfig) {
        var config = nativeEvent ? nativeEvent : eventConfig;

        this.nativeEvent = nativeEvent ? nativeEvent : null;
        this.type = config.type;
        this.target = config.target;
        this.currentTarget = config.target;
        this._bubbling = nativeEvent ? domEventsBubbling[config.type] : eventConfig && eventConfig._bubbling;
        this.stopped = false;
    }

    /**
     * Останавливает распространение события далее
     * @return void
     */
    stopPropagation(): void {
        this.stopped = true;
        if (this.nativeEvent) {
            this.nativeEvent.stopPropagation();
        }
    }

    /**
     * Возвращает состояние распространения события (true - событие далее не распространяем)
     * @returns {boolean}
     */
    isStopped(): boolean {
        return this.stopped;
    }

    /**
     * Возвращает состояние всплытия события (true - событие всплывает дальше)
     * @returns {boolean}
     */
    isBubbling(): boolean {
        return this._bubbling;
    }

    /**
     * Отменяет событие (если возможно остановить всплытие у nativeEvent)
     * @return void
     */
    preventDefault(): void {
        if (this.nativeEvent) {
            this.nativeEvent.preventDefault();
        }
    }

    /**
     * Возвращает true, если событие нужно распространять далее
     * @returns {boolean}
     */
    propagating(): boolean {
        return this._bubbling === true && this.stopped === false;
    }

    /**
     * Останавливает распространение события далее
     * @return void
     */
    stopImmediatePropagation(): void {
        this.stopPropagation();
    }
}
