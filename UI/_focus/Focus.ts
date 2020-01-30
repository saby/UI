/// <amd-module name="UI/_focus/Focus" />

/**
 * Utility module that provides a cross-browser way to move focus
 * to specific elements
 * @author Белотелов Н.В.
 */

// @ts-ignore
import { detection } from 'Env/Env';

// @ts-ignore
import { Logger } from 'UI/Utils';

import { collectScrollPositions } from './_ResetScrolling';
import * as ElementFinder from './ElementFinder';
import { notifyActivationEvents } from 'UI/_focus/Events';

interface IFocusConfig {
   enableScreenKeyboard?: boolean;
   enableScrollToElement?: boolean;
}

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
 * Trying all possible ways to focus element. Return true if successfully focused.
 * @param element
 */
function tryMoveFocus(element: Element, cfg: IFocusConfig): boolean {
   let result = false;
   if (!result) {
      if (detection.isIE && element.setActive) {
         // In IE, calling `focus` scrolls the focused element into view,
         // which is not the desired behavior. Built-in `setActive` method
         // makes the element active without scrolling to it
         element.setActive();
         result = element === document.activeElement;
      }
   }
   if (!result) {
      if (element.focus) {
         element.focus();
         result = element === document.activeElement;
      } else {
         try {
            // The element itself does not have a focus method.
            // This is true for SVG elements in Firefox and IE,
            // as well as MathML elements in every browser.
            // IE9 - 11 will let us abuse HTMLElement's focus method,
            // Firefox and Edge will throw an error.
            HTMLElement.prototype.focus.call(element);
            result = element === document.activeElement;
         } catch (e) {
            result = focusSvgForeignObjectHack(element as SVGElement);
         }
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
            const message = '[UI/_focus/Focus:checkFocused] - Can\'t focus element because of this element or it\'s parent ' +
               `has ${reason} style! maybe you need use ws-hidden or ws-invisible classes for change element ` +
               'visibility (in old ws3 controls case). Please check why invisible element is focusing.' +
               `Focusing element is ${elementString}, invisible element is ${currentElementString}.`;
            Logger.warn(message, currentElement);

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
   return collectScrollPositions(element);
}

function matches(el: Element, selector: string): boolean {
   return (
      el.matches ||
      el.matchesSelector ||
      el.msMatchesSelector ||
      el.mozMatchesSelector ||
      el.webkitMatchesSelector ||
      el.oMatchesSelector
   ).call(el, selector);
}
function checkInput(el: Element): boolean {
   return matches(el, 'input[type="text"], textarea, *[contentEditable=true]');
}
function hasControl(element) {
   return element.controlNodes || element.wsControl;
}
function getContainerWithControlNode(element: Element): Element {
   while (element) {
      // ищем ближайший элемент, который может быть сфокусирован и не является полем ввода
      if (hasControl(element) && ElementFinder.getElementProps(element).tabStop && !checkInput(element)) {
         break;
      }
      element = element.parentElement;
   }
   return element;
}

function checkEnableScreenKeyboard(): boolean {
   return detection.isMobilePlatform;
}

function fixScrollingEffect(undoScrolling: Function): void {
   if (detection.safari) {
      // для сафари нужен timeout, почему-то фокус не успевает проскроллить элемент,
      // и вычисляется неправильный новый scrollTOp
      setTimeout(() => {
         undoScrolling();
      }, 0);
   } else {
      undoScrolling();
   }
}

function fixElementForMobileInputs(element: Element, cfg: IFocusConfig): Element {
   // на мобильных устройствах иногда не надо ставить фокус в поля ввода. потому что может показаться
   // экранная клавиатура. на ipad в случае асинхронной фокусировки вообще фокусировка откладывается
   // до следующего клика, и экранная клавиатура показывается не вовремя.

   // можно было бы вообще ничего не фокусировать, но есть кейс когда это нужно:
   // при открытии задачи поле исполнителя должно активироваться, чтобы показался саггест.
   // но фокус на поле ввода внутри не должен попасть, чтобы не повторилась ошибка на ipad.

   // поищем родительский элемент от найденного и сфокусируем его. так контрол, в котором лежит
   // поле ввода, будет сфокусирован, но фокус встанет не в поле ввода, а в его контейнер.

   // enableScreenKeyboard должен быть параметром метода activate, а не свойством контрола поля ввода,
   // потому что решается базовая проблема, и решаться она должна в общем случае (для любого
   // поля ввода), и не для любого вызова activate а только для тех вызовов, когда эта поведение
   // необходимо. Например, при открытии панели не надо фокусировать поля ввода
   // на мобильных устройствах.
   let result = element;
   if (!cfg.enableScreenKeyboard && checkEnableScreenKeyboard()) {
      // если попали на поле ввода, нужно взять его родительский элемент и фокусировать его
      if (checkInput(element)) {
         result = getContainerWithControlNode(element);
      }
   }
   return result;
}

/**
 * Moves focus to a specific HTML or SVG element
 */
function focusInner(
   element: Element,
   cfg: IFocusConfig
): boolean {
   let fixedElement: Element = element;
   // Заполняем cfg значениями по умолчанию, если другие не переданы

   fixedElement = fixElementForMobileInputs(element, cfg);

   const undoScrolling = makeResetScrollFunction(fixedElement, cfg.enableScrollToElement);
   const result = tryMoveFocus(fixedElement);
   checkFocused(fixedElement);

   if (result) {
      fixScrollingEffect(undoScrolling);
   }

   return result;
}

function fireActivationEvents(target: Element, relatedTarget: Element): void {
   notifyActivationEvents(target, relatedTarget, false);
}

let focusingState;
let nativeFocus: Function;
function focus(element: Element, {enableScreenKeyboard = false, enableScrollToElement = false}:
   IFocusConfig = {enableScreenKeyboard: false, enableScrollToElement: false}): boolean {
   let res;
   const cfg: IFocusConfig = {enableScrollToElement, enableScreenKeyboard};
   const lastFocused: Element = document.activeElement;
   if (focusingState) {
      nativeFocus.call(element);
   } else {
      focusingState = true;
      try {
         res = focusInner.apply(this, arguments);
      } finally {
         focusingState = false;
      }
   }
   // @ts-ignore
   // мы не должны стрелять событиями активации во время восстановления фокуса после перерисовки
   // но делать это публичным апи тоже нельзя, 
   // т.к. фокусировка без событий активации может сломать систему фокусов
   if (!focus.__restoreFocusPhase) {
      fireActivationEvents(document.activeElement, lastFocused);
   }
   return res;
}

   // Заменяем нативный фокус на функцию из библиотеки фокусов.
   // В ней исправлены многие ошибки кроссбраузерной и кроссплатформенной совместимости.
   // Кроме того это упрощает отладку, т.к. способ программно сфокусировать элемент будет только один.
function _initFocus(): void {
   if (typeof HTMLElement !== 'undefined') {
      nativeFocus = HTMLElement.prototype.focus;
      HTMLElement.prototype.focus = function replacedFocus(): void {
         if (!focusingState) {
            const message = '[UI/_focus/Focus:_initFocus]" - Native focus is called! Please use special focus method (UI/Focus:focus)';
            Logger.warn(message);
         }

         focus(this, {
            enableScreenKeyboard: true,
            enableScrollToElement: true,
            enableActivationEvents: false
         });
      };
   }
}
_initFocus();

export { focus, _initFocus, IFocusConfig };
