/**
 * @author Тэн В.А.
 * Содержит логику восстановление фокуса, если фокус слетает на body
 */

import { goUpByControlTree } from 'UI/NodeCollector';
import { isElementVisible } from 'UI/Utils';

import { notifyActivationEvents } from './Events';
import { focus } from './Focus';
import { IControl } from './IControl';

function checkActiveElement(savedActiveElement: Element): boolean {
   const isBody = document.activeElement === document.body || document.activeElement === null;
   return isBody && document.activeElement !== savedActiveElement;
}

function isDestroyedControl(control: any): boolean {
   return control.isDestroyed && control.isDestroyed() || control._destroyed;
}

/*
 * Поиск невидимых элементов среди предков.
 * FIXME: https://online.sbis.ru/opendoc.html?guid=0e12f26e-776c-4822-94aa-d1a93bbddccf
 */
function isTreeVisible(element: HTMLElement): boolean {
   let currentElement = element;
   while (currentElement) {
      const calculatedStyle = getComputedStyle(currentElement);
      if (calculatedStyle.display === 'none' || calculatedStyle.visibility === 'hidden') {
         return false;
      }
      currentElement = currentElement.parentElement;
   }
   return true;
}

let prevControls = [];
let lastSavedActiveElement;
export function restoreFocus(control: IControl, action: Function): void {
   if ( document.activeElement !== document.body ) {
      // Если фокус не улетел в Body, сохраним контрол, который был в фокусе и список контролов
      lastSavedActiveElement = document.activeElement;
      // нужно вычислять родительские контролы заранее, во время перерисовки эти контролы могут быть
      // разрушены и мы потеряем реальную иерархию, и не сможем восстановить фокус куда надо.
      // метод должен отрабатывать супер быстро, не должно влиять на скорость
      prevControls = goUpByControlTree(lastSavedActiveElement);
   }

   // @ts-ignore private method
   const environment = control._getEnvironment();
   action();
   environment._restoreFocusState = true;
   // если сразу после изменения DOM-дерева фокус слетел в body, пытаемся восстановить фокус на ближайший элемент от
   // предыдущего активного, чтобы сохранить контекст фокуса и дать возможность управлять с клавиатуры
   if (checkActiveElement(lastSavedActiveElement)) {
      //@ts-ignore need es6 on tsconfig
      prevControls.find((currentControl) => {
         // в списке контролов может остаться очищенный контрол, делать в NodeCollector'е не можем,
         // т.к.замедлит выполнение goUpByControlTree
         if (isDestroyedControl(currentControl)) {
            return false;
         }
         if (!currentControl._template && !currentControl._container) {
            // СОВМЕСТИМОСТЬ: у старых невизуальных контролов может не быть контейнера
            // (например, SBIS3.CONTROLS/Action/OpenDialog)
            return false;
         }
         // совместимость. среди контролов могут встретиться ws3
         let container = currentControl._container;
         let isOldControl = false;
         if (!currentControl._template) {
            container = currentControl.getContainer()[0];
            isOldControl = true;
         }
         // @ts-ignore
         focus.__restoreFocusPhase = true;
         const containerVisible = isElementVisible(container) && isTreeVisible(container);
         const result = containerVisible && focus(container, {}, isOldControl);
         // @ts-ignore
         delete focus.__restoreFocusPhase;
         return result;
      });
      // следим за состоянием _savedFocusedElement. хотелось бы делать это в environment в обработчике
      // на focus, но как минимум в IE на вызов фокуса туда не попадеам
      // @ts-ignore
      notifyActivationEvents._savedFocusedElement = document.activeElement;

      // Попытаемся восстановить фокус, только если он действительно слетел с контрола, помеченного __$focusing
      // для совместимости, фокус устанавливаелся через старый механизм setActive,
      // нужно восстановить фокус после _rebuild
      // проверяю на control._mounted, _rebuild сейчас не синхронный, он не гарантирует что асинхронные ветки
      // перерисовались
      // @ts-ignore private method in control
      if (control.__$focusing && !control.isDestroyed() && control._mounted) {
         control.activate();
         // до синхронизации мы сохранили __$focusing - фокусируемый элемент,
         // а после синхронизации здесь фокусируем его.
         // если не нашли фокусируемый элемент - значит в доме не оказалось этого элемента.
         // но мы все равно отменяем скинем флаг, чтобы он не сфокусировался позже когда уже не надо
         // https://online.sbis.ru/opendoc.html?guid=e46d87cc-5dc2-4f67-b39c-5eeea973b2cc
         // @ts-ignore private method in control
         control.__$focusing = false;
      }
   }
   environment._restoreFocusState = false;
}
