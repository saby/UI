/// <amd-module name="UI/_focus/PreventFocus" />

export function preventFocus(event: MouseEvent): void {
   let element = event.target;
   const html = document.documentElement;
   while (element !== html) {
      // todo совместимость! когда уберем совместимость, надо убрать element.getAttribute('ws-no-focus')
      if (element['ws-no-focus'] || element.getAttribute('ws-no-focus')) {
         event.preventDefault();
         break;
      } else {
         element = element.parentNode;
      }
   }
}
