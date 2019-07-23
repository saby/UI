// @ts-ignore
import { goUpByControlTree } from './goUpByControlTree';
// @ts-ignore
import isElementVisible = require('Core/helpers/Hcontrol/isElementVisible');

import { Control } from 'UI/Base';

import { focus } from './Focus';

function checkActiveElement(savedActiveElement: Element): boolean {
   const isBody = document.activeElement === document.body || document.activeElement === null;
   return isBody && document.activeElement !== savedActiveElement;
}

export function restoreFocus(control: Control, action: Function): void {
   const savedActiveElement = document.activeElement;
   // нужно вычислять родительские контролы заранее, во время перерисовки эти контролы могут быть
   // разрушены и мы потеряем реальную иерархию, и не сможем восстановить фокус куда надо.
   // метод должен отрабатывать супер быстро, не должно влиять на скорость
   const prevControls = goUpByControlTree(savedActiveElement);

   action();

   const environment = control._getEnvironment();

   environment._restoreFocusState = true;
   // если сразу после изменения DOM-дерева фокус слетел в body, пытаемся восстановить фокус на ближайший элемент от
   // предыдущего активного, чтобы сохранить контекст фокуса и дать возможность управлять с клавиатуры
   if (checkActiveElement(savedActiveElement)) {
      prevControls.find((control) => {
         const container = control._container[0] ? control._container[0] : control._container;
         return isElementVisible(control._container) && focus(container);
      });
   }
   environment._restoreFocusState = false;

   // для совместимости, фокус устанавливаелся через старый механизм setActive, нужно восстановить фокус после _rebuild
   if (control.__$focusing && !control.isDestroyed()) {
      control.activate();
      // до синхронизации мы сохранили __$focusing - фокусируемый элемент, а после синхронизации здесь фокусируем его.
      // если не нашли фокусируемый элемент - значит в доме не оказалось этого элемента.
      // но мы все равно отменяем скинем флаг, чтобы он не сфокусировался позже когда уже не надо
      // https://online.sbis.ru/opendoc.html?guid=e46d87cc-5dc2-4f67-b39c-5eeea973b2cc
      control.__$focusing = false;
   }
}
