/// <amd-module name="UICore/_nodeCollector/goUpByControlTree" />
/* tslint:disable */

/**
 * @author Шипин А.А.
 * Модуль позволяет собрать список всех родительских контролов и опенеров
 */

//@ts-ignore
import { constants } from 'Env/Env';
//@ts-ignore
import { Logger } from 'UICommon/Utils';

export default function goUpByControlTree(target, array?) {
   array = array || [];
   if (target && target.jquery) {
      // Unwrap jQuery element if it is present
      target = target[0];
   }
   if (target) {
      if (target.controlNodes && target.controlNodes.length) {
         // Для новых контролов
         addControlsToFlatArray(target.controlNodes[0], array);
      } else if (constants.compat && target.wsControl) {
         // Если встретили старый компонент, нужно собирать его парентов по старому API
         addControlsToFlatArrayOld(target.wsControl, array);
      } else {
         // Рекурсивно поднимаемся вверх по элементам, пока не сможем вычислить ближайший компонент
         goUpByControlTree(target.parentNode, array);
      }
   }
   return array;
}


/**
 * Вычисляет controlNode для control
 * @param control
 * @returns {*}
 */
function getControlNode(control) {
   var controlNodes = control._container.controlNodes;
   for (var i in controlNodes) {
      if (controlNodes[i].control === control) {
         return controlNodes[i];
      }
   }
}

function checkOpener(opener) {
   let error;

   if (opener) {
      // Component instance must have _options
      if (opener && !opener._options) {
         let name = opener.getName ? opener.getName() : '[not detected]';
         error = `Control ${opener._moduleName} with name ${name} must have _options`;
      }

      // if (opener.isDestroyed && opener.isDestroyed()) {
      //    error = "Control " + opener._moduleName + " with name " + (opener.getName && opener.getName()) + " was destroyed, but found as parent or opener of current control";
      // }
   }

   if (error) {
      const message = `[UICore/_nodeCollector/goUpByControlTree:checkOpener] DOMEnvironment - Incorrect opener or parent is found! It seems that anybody set wrong opener option! ${error}`;
      Logger.error(message, opener);
   }
}

/**
 * Focus parent is a component that contains the given control
 * "logically" and receives the focus whenever the given control
 * is focused.
 * @param control Control to get the focus parent for
 * @returns Focus parent of the given control
 */
function getFocusParent(control) {
   // ищем предка текущего контрола, сначала смотрим есть ли opener, если нет - берем parent
   var result = (control._options && control._options.opener) ||
      (control.getOpener && control.getOpener()) ||
      (control._options && control._options.parent) ||
      (control.getParent && control.getParent());
   if (!result || result.__purified) {
      return null;
   } else {
      return result;
   }
}

/**
 * Recursively collect array of openers or parents
 * @param controlNode
 * @param array
 */
function addControlsToFlatArray(controlNode, array) {
   var control = controlNode.control;

   if (array[array.length - 1] !== control) {
      array.push(control);
   }

   // Поднимаемся по controlNode'ам, потому что у control'а нет доступа к родительскому контролу
   var next = control._options.opener || controlNode.parent;
   if (next && next._destroyed) {
      return;
   }
   if (next && !next.control) {
      if (next._container) {
         checkOpener(next);
         next = getControlNode(next);
      } else {
         // если компонент невизуальный, ничего не ищем
         next = null;
      }
   }
   if (next) {
      addControlsToFlatArray(next, array);
   } else {
      next = getFocusParent(control);
      checkOpener(next);
      // может мы уперлись в кореневой VDOM и надо посмотреть, есть ли на нем wsControl, если есть - начинаем вслпывать по старому
      if (next) {
         addControlsToFlatArrayOld(next, array);
      }
   }
}

function addControlsToFlatArrayOld(control, array) {
   if (array[array.length - 1] !== control) {
      array.push(control);
   }

   var parent = getFocusParent(control);

   checkOpener(parent);

   if (parent) {
      // если найденный компонент является vdom-компонентом, начинаем всплывать по новому
      if (parent._template && parent._container) {
         var container = parent._container;
         var controlNode = container.controlNodes && container.controlNodes[0];
         if (controlNode) {
            addControlsToFlatArray(container.controlNodes[0], array);
         } else if (typeof parent.hasCompatible === 'function' && parent.hasCompatible()) {
            // On old pages it is possible that the vdom component has already been destroyed
            // and its control node was removed from container. If it has compatible layer
            // mixed in, we can still get the parent using old methods
            addControlsToFlatArrayOld(parent, array);
         }
      } else {
         addControlsToFlatArrayOld(parent, array);
      }
   }
}
