/**
 * @author Тэн В.А.
 */

import { focus } from "UI/Focus";
import { IControlElement } from "UI/_focus/IFocus";

interface IMouseEventInitExtend extends MouseEventInit {
   type: string;
   target: EventTarget;
   currentTarget: EventTarget;
   eventPhase: number;
   stopPropagation?: Function;
   preventDefault?: Function;
}

const fastEventList = ['mouseover', 'mousedown', 'mouseup', 'click', 'focus'];
const useNativeEventList = ['input', 'textarea'];

export class FastTouchEndController {
   private static needClickEmulate: boolean = true;

   static setClickEmulateState(state: boolean): void {
      this.needClickEmulate = state;
   }

   static clickEmulate(targetElement: Element, nativeEvent: TouchEvent): void {
      if (this.useNativeTouchEnd(targetElement, nativeEvent)) {
         return;
      }
      focus(nativeEvent.target as IControlElement);
      nativeEvent.preventDefault();
      const touch = nativeEvent.changedTouches[0];
      let clickEvent;
      for (let i = 0; i < fastEventList.length; i++) {
         // надо создавать новое событие мыши, а не отдавать объект в систему событий, т.к.
         // в некоторых случаях события всплывают не правильно (например аккордеон)
         clickEvent = new MouseEvent(fastEventList[i], this.createMouseEvent(fastEventList[i], nativeEvent, touch));
         targetElement.dispatchEvent(clickEvent);
      }
   }

   static isFastEventFired(eventName: string): boolean {
      return fastEventList.indexOf(eventName) > -1;
   }

   private static useNativeTouchEnd(targetElement: Element, nativeEvent: TouchEvent): boolean {
      if (!nativeEvent) {
         return true;
      }
      if (!nativeEvent.preventDefault) {
         return true;
      }
      if (!this.needClickEmulate) {
         return true;
      }
      if (this.isNativeList(targetElement)) {
         return true;
      }
      // БТР - это div c contentEditable, поэтому выделяя его или элементы внутри него мы не должны
      // менять поведение тача (напримре выделение текста по двойному тапу);
      if (this.isContentEditable(targetElement)) {
         return true;
      }
      // надо учитывать, что поведение при клике в элемент который должен работать с нативным touchend
      // и клике вне него (когда он в фокусе) должны работать нативно (например фокус в input и открыть popup)
      if (this.isNativeList(document.activeElement) || this.isContentEditable(document.activeElement)) {
         return true;
      }
      // вызываем нативный тач если есть специальный класса
      if(targetElement.classList.contains("ws-disableFastTouch")) {
         return true;
      }
      // вызываем нативный тач если событие создано вручную
      if(!nativeEvent.isTrusted) {
         return true;
      }
      return false;
   }

   private static isNativeList(element: Element): boolean {
      return useNativeEventList.indexOf(element.tagName.toLowerCase()) > -1;
   }

   private static isContentEditable(element: Element): boolean {
      return (element.hasAttribute('contentEditable') ||
          (element.parentElement && element.parentElement.hasAttribute('contentEditable')));
   }

   private static createMouseEvent(eventName: string, event: TouchEvent, touch: Touch): IMouseEventInitExtend {
      return {
         type: eventName,
         bubbles: event.bubbles,
         cancelable: event.cancelable,
         view: window,
         detail: 1,
         screenX: touch.screenX,
         screenY: touch.screenY,
         clientX: touch.clientX,
         clientY: touch.clientY,
         ctrlKey: event.ctrlKey,
         altKey: event.altKey,
         shiftKey: event.shiftKey,
         metaKey: event.metaKey,
         button: 0,
         buttons: 0,
         relatedTarget: null,
         target: event.target,
         currentTarget: event.currentTarget,
         eventPhase: 1, // capture phase
         stopPropagation(): void {
            this.bubbles = false;
         },
         preventDefault(): void {
            // no action
         }
      };
   }
}
