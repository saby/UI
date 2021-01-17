/**
 * @author Тэн В.А.
 */

interface IMouseEventInitExtend extends MouseEventInit {
   type: string;
   target: EventTarget;
   currentTarget: EventTarget;
   eventPhase: number;
   stopPropagation?: Function;
   preventDefault?: Function;
}

const fastEventList = ['mousedown', 'mouseup', 'click'];
const useNativeEventList = ['input'];

export class FastTouchEndController {
   private static needClickEmulate: boolean = true;

   static setClickEmulateState(state: boolean): void {
      this.needClickEmulate = state;
   }

   static clickEmulate(targetElement: Element, nativeEvent: TouchEvent): void {
      if (this.useNativeTouchEnd(targetElement, nativeEvent)) {
         return;
      }
      nativeEvent.preventDefault();
      const touch = nativeEvent.changedTouches[0];
      let clickEvent;
      for (let i = 0; i < fastEventList.length; i++) {
         clickEvent = new MouseEvent(fastEventList[i], this.createMouseEvent(fastEventList[i], nativeEvent, touch));
         targetElement.dispatchEvent(clickEvent);
      }
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
      if (useNativeEventList.indexOf(targetElement.tagName.toLowerCase()) > -1) {
         return true;
      }
      return false;
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
