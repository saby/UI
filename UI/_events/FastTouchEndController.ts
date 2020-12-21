/**
 * @author Тэн В.А.
 */
export class FastTouchEndController {
   static clickEmulate(targetElement: Element, nativeEvent: TouchEvent): void {
      nativeEvent.preventDefault();
      const clickEvent = document.createEvent('MouseEvents');
      const touch = nativeEvent.changedTouches[0];
      clickEvent.initMouseEvent('click',
         true,
         true,
         window,
         1,
         touch.screenX,
         touch.screenY,
         touch.clientX,
         touch.clientY,
         false,
         false,
         false,
         false,
         0,
         null);
      targetElement.dispatchEvent(clickEvent);

      clickEvent.initMouseEvent('mousedown',
         true,
         true,
         window,
         1,
         touch.screenX,
         touch.screenY,
         touch.clientX,
         touch.clientY,
         false,
         false,
         false,
         false,
         0,
         null);
      targetElement.dispatchEvent(clickEvent);
   }
}
