/// <amd-module name="UI/_focus/PreventFocus" />

/**
 * @author Белотелов Н.В.
 */

export function hasNoFocus(element: Element): boolean {
   const html = document.documentElement;
   while (element !== html) {
      // todo совместимость! когда уберем совместимость, надо убрать element.getAttribute('ws-no-focus')
      if (element['ws-no-focus'] || element.getAttribute('ws-no-focus')) {
         return true;
      } else {
         element = element.parentNode;
      }
   }
   return false;
}
export function preventFocus(event: MouseEvent): void {
   if (hasNoFocus(event.target)) {
      event.preventDefault();
   }
}
