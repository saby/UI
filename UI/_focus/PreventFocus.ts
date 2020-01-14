/// <amd-module name="UI/_focus/PreventFocus" />

/**
 * @author Белотелов Н.В.
 */

export function hasNoFocus(element: Element): boolean {
   const html = document.documentElement;
   let currentElement = element;
   while (currentElement !== html) {
      // todo совместимость! когда уберем совместимость, надо убрать element.getAttribute('ws-no-focus')
      if (currentElement['ws-no-focus'] || currentElement.getAttribute('ws-no-focus')) {
         return true;
      } else {
         currentElement = currentElement.parentElement;
      }
   }
   return false;
}
export function preventFocus(event: MouseEvent): void {
   // @ts-ignore
   if (hasNoFocus(event.target)) {
      event.preventDefault();
   }
}
