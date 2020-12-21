/**
 * @author Тэн В.А.
 */
const fastEventList = ['mousedown', 'mouseup', 'click'];

export class FastTouchEndController {
   static clickEmulate(targetElement: Element, nativeEvent: TouchEvent): void {
      if (!nativeEvent) {
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

   private static createMouseEvent(eventName: string, event: TouchEvent, touch: Touch) {
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
         }}
   }

}
