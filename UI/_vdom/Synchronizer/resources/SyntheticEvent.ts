/// <amd-module name="UI/_vdom/Synchronizer/resources/SyntheticEvent" />
/* tslint:disable */

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

interface IEventConfig {
   type: string;
   target: EventTarget;
   _bubbling: boolean;
}

export default class SyntheticEvent<TNativeEvent extends Event = Event> {
   nativeEvent: TNativeEvent;
   type: string;
   target: EventTarget;
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

   stopPropagation(): void {
       this.stopped = true;
       if (this.nativeEvent) {
           this.nativeEvent.stopPropagation();
       }
   }

   isStopped(): boolean {
       return this.stopped;
   }

   isBubbling(): boolean {
       return this._bubbling;
   }

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

   stopImmediatePropagation(): void {
       this.stopPropagation();
   }
}
