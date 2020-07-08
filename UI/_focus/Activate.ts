/// <amd-module name="UI/_focus/Activate" />

/**
 * @author Белотелов Н.В.
 * Модуль, в котором находится логика по активации контролов
 */

// @ts-ignore
import { detection } from 'Env/Env';
import * as ElementFinder from './ElementFinder';
import { focus } from './Focus';
import { goUpByControlTree } from 'UI/NodeCollector';

// @ts-ignore
import isElementVisible = require('Core/helpers/Hcontrol/isElementVisible');

function findAutofocusForVDOM(findContainer: Element): NodeListOf<Element> {
   return findContainer.querySelectorAll('[ws-autofocus="true"]');
}

function doFocus(container: any,
                 cfg: { enableScreenKeyboard?: boolean,
                        enableScrollToElement?: boolean } = {}): boolean {

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
         res = focus(container, cfg);
         if (res) {
            // поддерживаем совместимость. нужно отстрелять старые события чтобы область в WindowManager стала
            // последней активной, чтобы потом на нее восстанавливался фокус если он будет восстанавливаться
            // по старому механизму
            const parents = goUpByControlTree(container);
            if (parents.length && parents[0]._activate) {
               parents[0]._activate(parents[0]);
            }
         }
      }
   }
   return res;
}

export function activate(
   container: Element,
   cfg: { enableScreenKeyboard?: boolean, enableScrollToElement?: boolean } =
      {enableScreenKeyboard: false, enableScrollToElement: false}
   ): boolean {

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
      let next = ElementFinder.findFirstInContext(container, false);
      if (next) {
         // при поиске первого элемента игнорируем vdom-focus-in и vdom-focus-out
         const startElem = 'vdom-focus-in';
         const finishElem = 'vdom-focus-out';
         if (next.classList.contains(startElem)) {
            next = ElementFinder.findWithContexts(container, next, false);
         }
         if (next.classList.contains(finishElem)) {
            next = null;
         }
      }
      if (next) {
         res = doFocus(next, cfg);
      } else {
         if (isElementVisible(container)) {
            res = doFocus(container, cfg);
         } else {
            // если элемент не видим - не можем его сфокусировать
            res = false;
         }
      }
   }

   return res;
}
