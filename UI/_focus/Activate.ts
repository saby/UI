/// <amd-module name="UI/_focus/Activate" />

// @ts-ignore
import { detection } from 'Env/Env';
import * as ElementFinder from './ElementFinder';
import { focus } from './Focus';

// @ts-ignore
import isElementVisible = require('Core/helpers/Hcontrol/isElementVisible');

function findAutofocusForVDOM(findContainer: Element): NodeListOf<Element> {
   return findContainer.querySelectorAll('[ws-autofocus="true"]');
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

export function activate(
   container: Element,
   cfg: { ignoreInputsOnMobiles?: boolean, enableScrollToElement?: boolean } = {}
   ): boolean {
   function getContainerWithControlNode(element: Element): Element {
      while (element) {
         // ищем ближайший элемент, который может быть сфокусирован и не является полем ввода
         if (element.controlNodes && ElementFinder.getElementProps(element).tabStop && !checkInput(element)) {
            break;
         }
         element = element.parentElement;
      }
      return element;
   }

   function doFocus(container: any): boolean {
      let res = false;
      if (container.wsControl && container.wsControl.setActive) {
         // если нашли контейнер старого контрола, активируем его старым способом (для совместимости)
         if (container.wsControl.canAcceptFocus()) {
            container.wsControl.setActive(true);
            res = container.wsControl.isActive();
         } else {
            // todo попробовать поискать следующий элемент?
            res = false;
         }
      } else {
         if (ElementFinder.getElementProps(container).tabStop) {
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
            if (!cfg.enableScreenKeyboard && detection.isMobilePlatform) {
               // если попали на поле ввода, нужно взять его родительский элемент и фокусировать его
               if (checkInput(container)) {
                  container = getContainerWithControlNode(container);
               }
            }
            focus(container, cfg);
         }
         res = container === document.activeElement;
      }
      return res;
   }

   let res = false;

   // сначала попробуем поискать по ws-autofocus, если найдем - позовем focus рекурсивно для найденного компонента
   const autofocusElems = findAutofocusForVDOM(container);
   let autofocusElem;
   let found;

   for (let i = 0; i < autofocusElems.length; i++) {
      autofocusElem = autofocusElems[i];

      // если что-то зафокусировали, перестаем поиск
      if (!found) {
         // фокусируем только найденный компонент, ws-autofocus можно повесить только на контейнер компонента
         if (autofocusElem && autofocusElem.controlNodes && autofocusElem.controlNodes.length) {
            // берем самый внешний контрол и активируем его
            const outerControlNode = autofocusElem.controlNodes[autofocusElem.controlNodes.length - 1];
            res = outerControlNode.control.activate(cfg);
            found = res;
         }
      }
   }

   // если не получилось найти по автофокусу, поищем первый элемент по табиндексам и сфокусируем его.
   // причем если это будет конейнер старого компонента, активируем его по старому тоже
   if (!found) {
      // так ищем DOMEnvironment для текущего компонента. В нем сосредоточен код по работе с фокусами.
      const getElementProps = ElementFinder.getElementProps;

      let next = ElementFinder.findFirstInContext(container, false, getElementProps);
      if (next) {
         // при поиске первого элемента игнорируем vdom-focus-in и vdom-focus-out
         const startElem = 'vdom-focus-in';
         const finishElem = 'vdom-focus-out';
         if (next.classList.contains(startElem)) {
            next = ElementFinder.findWithContexts(container, next, false, getElementProps);
         }
         if (next.classList.contains(finishElem)) {
            next = null;
         }
      }
      if (next) {
         res = doFocus(next);
      } else {
         if (isElementVisible(container)) {
            res = doFocus(container);
         } else {
            // если элемент не видим - не можем его сфокусировать
            res = false;
         }
      }
   }

   return res;
}
