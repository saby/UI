/// <amd-module name="UI/_focus/PreventFocus" />

/**
 * @author Белотелов Н.В.
 * Содержит логику по предотвращению фокуса по клику
 */

export function hasNoFocus(element: Element): boolean {
   const html = document.documentElement;
   let currentElement: Element = element;
   while (currentElement !== html) {
      // todo совместимость! когда уберем совместимость, надо убрать element.getAttribute('ws-no-focus')
      if (currentElement['ws-no-focus'] || currentElement.getAttribute('ws-no-focus')) {
         return true;
      } else {
         // Используем parentNode, вместо parentElement, потому что в ie у svg-элементов, нет свойства parentElement
         // @ts-ignore
         currentElement = currentElement.parentNode;
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
