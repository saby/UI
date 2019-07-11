/// <amd-module name="UI/_focus/Focus" />

/**
 * Utility module that provides a cross-browser way to move focus
 * to specific elements
 */
// @ts-ignore
import { detection, IoC } from 'Env/Env';

import resetScrolling from 'Vdom/_private/Utils/ResetScrolling';

/**
 * make foreignObject instance. using for hack with svg focusing.
 */
function makeFocusableForeignObject(): ChildNode {
   const fragment = document.createElement('div');
   fragment.innerHTML =
      '<svg><foreignObject width="30" height="30">' + '<input type="text"/>' + '</foreignObject></svg>';

   return fragment.firstChild.firstChild;
}
/**
 * focusing of foreignObject. This hack will be use when it is need to focus svg element.
 */
function focusSvgForeignObjectHack(element: SVGElement): boolean {
   // Edge13, Edge14: foreignObject focus hack
   // https://jsbin.com/kunehinugi/edit?html,js,output
   // https://jsbin.com/fajagi/3/edit?html,js,output
   const isSvgElement = element.ownerSVGElement || element.nodeName.toLowerCase() === 'svg';
   if (!isSvgElement) {
      return false;
   }

   // inject and focus an <input> element into the SVG element to receive focus
   const foreignObject = makeFocusableForeignObject();
   element.appendChild(foreignObject);
   const input = (foreignObject as Element).querySelector('input');
   input.focus();

   // upon disabling the activeElement, IE and Edge
   // will not shift focus to <body> like all the other
   // browsers, but instead find the first focusable
   // ancestor and shift focus to that
   input.disabled = true;

   // clean up
   element.removeChild(foreignObject);
   return true;
}
/**
 * trying to focus element by different ways
 */
function tryMoveFocus(element: Element): boolean {
   let result = false;
   if (!result) {
      if (detection.isIE && element.setActive) {
         // In IE, calling `focus` scrolls the focused element into view,
         // which is not the desired behavior. Built-in `setActive` method
         // makes the element active without scrolling to it
         try {
            element.setActive();
            result = true;
         } catch (e) {
            result = false;
         }
      }
   }
   if (!result) {
      if (element.focus) {
         element.focus();
         result = true;
      }
   }
   if (!result) {
      try {
         // The element itself does not have a focus method.
         // This is true for SVG elements in Firefox and IE,
         // as well as MathML elements in every browser.
         // IE9 - 11 will let us abuse HTMLElement's focus method,
         // Firefox and Edge will throw an error.
         HTMLElement.prototype.focus.call(element);
         result = true;
      } catch (e) {
         result = focusSvgForeignObjectHack(element);
      }
   }
   return result;
}
/**
 * check if focus of element was successful.
 */
function checkFocused(element: Element): void {
   // если фокусируется скрытый элемент (или его предок скрыт), выводим ошибку, потому что он не сфокусируется
   if (element !== document.activeElement) {
      let currentElement = element;
      while (currentElement) {
         let reason;
         const style = getComputedStyle(currentElement);
         if (style.display === 'none') {
            reason = 'display: none';
         }
         if (style.visibility === 'hidden') {
            reason = 'visibility: hidden';
         }
         if (reason) {
            const elementString = element.outerHTML.slice(0, element.outerHTML.indexOf('>') + 1);
            const currentElementString = currentElement.outerHTML.slice(0, currentElement.outerHTML.indexOf('>') + 1);
            IoC.resolve('ILogger').warn('UI/Focus', 'Can\'t focus element because of this element or it\'s parent ' +
               'has "' + reason + '" style! maybe you need use ws-hidden or ws-invisible classes for change element ' +
               'visibility (in old ws3 controls case). Please check why invisible element is focusing. ' +
               'focusing element is "' + elementString + '", invisible element is "' + currentElementString + '"');
            break;
         }
         currentElement = currentElement.parentElement;
      }
   }
}

// List of input types that iOS Safari and Chrome scroll to when focused
const iosScrollableInputTypes = ['text', 'date', 'password', 'email', 'number'];

// Check if the iOS Safari and Chrome would scroll to the given
// element when it is focused
function isIosScrollableInput(element: Element): boolean {
   const tagName = element.tagName.toLowerCase();
   const inputType = element.getAttribute('type');

   const isScrollableInput = (
      tagName === 'input' &&
      (!inputType || iosScrollableInputTypes.indexOf(inputType) >= 0)
   );
   const isTextArea = tagName === 'textarea';
   const isEditable = element.hasAttribute('contenteditable');

   return isScrollableInput || isTextArea || isEditable;
}

// Empty function, does nothing
const ignoreResetScroll = () => {
   // empty
};

function makeResetScrollFunction(element: Element, enableScrollToElement: boolean): () => void {
   if (
      detection.isMobileIOS &&
      (detection.safari || detection.chrome) &&
      isIosScrollableInput(element)
   ) {
      // In iOS Safari and Chrome pressing on an editable area (like input
      // or textarea) pops up the keyboard and scrolls the input into
      // view.
      return ignoreResetScroll;
   }
   if (enableScrollToElement) {
      // если настроена специальная опция, которая разрешает скроллить к фокусируемому элементу, разрешаем скролл
      return ignoreResetScroll;
   }
   return resetScrolling(element);
}

/**
 * Moves focus to a specific HTML or SVG element
 */
export function focus(
      element: Element,
      cfg: { ignoreInputsOnMobiles?: boolean, enableScrollToElement?: boolean } = {}
      ): boolean {
   const undoScrolling = makeResetScrollFunction(element, cfg.enableScrollToElement);
   const result = tryMoveFocus(element);

   if (result) {
      if (detection.safari) {
         // для сафари нужен timeout, почему-то фокус не успевает проскроллить элемент,
         // и вычисляется неправильный новый scrollTOp
         setTimeout(() => {
            undoScrolling();
         }, 0);
      } else {
         undoScrolling();
      }
      checkFocused(element);
   } else {
      IoC.resolve('ILogger').error('UI/Focus', 'Can\'t focus element. Undefined way to focus.');
   }
   return result;
}
