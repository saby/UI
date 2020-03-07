import { appendFocusElementsToDOM } from './BoundaryElements';
// @ts-ignore
import isElementVisible = require('Core/helpers/Hcontrol/isElementVisible');

// TODO подумать как решить проблему циклических зависимостей при импорте интерфейсов
// В качестве временного решения отключен импорт и указан тип `any` в restoreFocus()
// https://online.sbis.ru/opendoc.html?guid=918b22a9-fbd5-4122-ab51-75a88f01bbbc
// import { Control } from 'UI/Base';

import { focus } from './Focus';

function checkActiveElement(savedActiveElement: Element): boolean {
   const isBody = document.activeElement === document.body || document.activeElement === null;
   return isBody && document.activeElement !== savedActiveElement;
}

// нужно вычислять родительские контролы заранее, во время перерисовки эти контролы могут быть
// разрушены и мы потеряем реальную иерархию, и не сможем восстановить фокус куда надо.
export function restoreFocus(savedActiveElement: Element, prevControls: any, control: any): void {
   const environment = control._getEnvironment();

   const rootContainer = control._container[0] ? control._container[0] : control._container;
   if (rootContainer === environment._rootDOMNode) {
      if (environment._rootDOMNode.tagName === 'HTML') {
         appendFocusElementsToDOM(environment, document.body);
      } else {
         appendFocusElementsToDOM(environment, environment._rootDOMNode);
      }
   }

   environment._restoreFocusState = true;
   // если сразу после изменения DOM-дерева фокус слетел в body, пытаемся восстановить фокус на ближайший элемент от
   // предыдущего активного, чтобы сохранить контекст фокуса и дать возможность управлять с клавиатуры
   if (checkActiveElement(savedActiveElement)) {
      prevControls.find((control) => {
         if (!control._template && !control._container) {
            // СОВМЕСТИМОСТЬ: у старых невизуальных контролов может не быть контейнера
            // (например, SBIS3.CONTROLS/Action/OpenDialog)
            return false;
         }
         // совместимость. среди контролов могут встретиться ws3
         const container = control._template ? control._container : control.getContainer()[0];
         return isElementVisible(container) && focus(container);
      });
      // следим за состоянием _savedFocusedElement. хотелось бы делать это в environment в обработчике
      // на focus, но как минимум в IE на вызов фокуса туда не попадеам
      environment.constructor.prototype._savedFocusedElement = document.activeElement;
      
      // Попытаемся восстановить фокус, только если он действительно слетел с контрола, помеченного __$focusing
      // для совместимости, фокус устанавливаелся через старый механизм setActive, нужно восстановить фокус после _rebuild
      // проверяю на control._mounted, _rebuild сейчас не синхронный, он не гарантирует что асинхронные ветки
      // перерисовались
      if (control.__$focusing && !control.isDestroyed() && control._mounted) {
         control.activate();
         // до синхронизации мы сохранили __$focusing - фокусируемый элемент, а после синхронизации здесь фокусируем его.
         // если не нашли фокусируемый элемент - значит в доме не оказалось этого элемента.
         // но мы все равно отменяем скинем флаг, чтобы он не сфокусировался позже когда уже не надо
         // https://online.sbis.ru/opendoc.html?guid=e46d87cc-5dc2-4f67-b39c-5eeea973b2cc
         control.__$focusing = false;
      }
   }
   environment._restoreFocusState = false;
}
