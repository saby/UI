/// <amd-module name="UI/_focus/Events" />
/* tslint:disable */

type TModifyHTMLNode = HTMLElement & Record<string, any>;
export interface IDOMEnvironment {
   _rootDOMNode: TModifyHTMLNode;
   __captureEventHandler: Function;
}

/**
 * @author Тэн В.А.
 * Модуль содержит логику вызова событий активации у контролов
 */

// @ts-ignore
import { constants, detection } from 'Env/Env';
import { Logger } from 'UI/Utils';
import { goUpByControlTree } from 'UI/NodeCollector';

interface ITabPressed {
   isShiftKey: boolean
   tabTarget: HTMLElement
}
type TTabPressesd = null | ITabPressed;
// иногда фокус уходит на какой-то фейковый элемент в боди. и наша система реагирует по делу что фокус улетел.
// например, когда нужно скопировать текст в буфер обмена, текст вставляется в фейковое поле ввода на боди.
// пытаюсь исправить ситуацию, угадывая странный элемент и не обращая внимание на то что он фокусируется.
function detectStrangeElement(element: Element): boolean {
   if (!element) {
      return false;
   }

   // Проверяем наличие в списке классов vdom-focus-in или vdom-focus-out. IE не поддерживает classList
   // для SVG-элементов, но так как элементы с vdom-focus-in и vdom-focus-out это ссылки (<a>), можно
   // элементы без classList не рассматривать
   if (element.classList && (element.classList.contains('vdom-focus-in') || element.classList.contains('vdom-focus-out'))) {
      // все нормально, это служебные элементы, на них должен передаваться фокус
      return false;
   }

   // если элемент лежит в боди и у него нет потомков - считаем его фейковым,
   // не стреляем в этом случае событиями активности
   // в IE обработчик срабатывает и в том случае, когда фокус переходит прямо на body, нужно
   // не обращать на это внимание
   return (
      (element.parentElement === document.body && !element.firstChild) || (detection.isIE && element === document.body)
   );
}
// FIXME: arrayMaker: wsControlType[]
function compatibleActivationEvents(environment: IDOMEnvironment, arrayMaker: any[]): void {
   // todo обратная совместимость
   if (constants.compat && environment._rootDOMNode && environment._rootDOMNode.controlNodes) {
      if (environment._rootDOMNode.controlNodes[0] && environment._rootDOMNode.controlNodes[0].control.isActive) {
         // если компонент уже активен, простреливаем событием onFocusInside
         if (environment._rootDOMNode.controlNodes[0].control.isActive()) {
            environment._rootDOMNode.controlNodes[0].control._callOnFocusInside();
         } else {
            // если еще не активен, активируем
            // @ts-ignore
            const areaAbstract = require('Lib/Control/AreaAbstract/AreaAbstract.compatible');
            areaAbstract._storeActiveChildInner.apply(
               environment._rootDOMNode.controlNodes[0].control
            );
         }

         if (arrayMaker.length) {
            if (!arrayMaker[0].isActive) {
               Logger.warn('Контрол нуждается в слое совместимости.', arrayMaker[0]);
            } else {
               // У старых контролов может не быть метода _activate, у них его вызывать не нужно
               if (!arrayMaker[0].isActive() && arrayMaker[0]._activate) {
                  arrayMaker[0]._activate(arrayMaker[0]);
               }
            }
         }
      }
   }
}

function getEnvironment(element: Element): IDOMEnvironment | null {
   // @ts-ignore
   return element.controlNodes && element.controlNodes.length > 0 && element.controlNodes[0].environment || null;
}
function findClosestEnvironment(sourceElement: Element): IDOMEnvironment | null {
   let currentElement = sourceElement;
   while(currentElement.parentElement) {
      let env = getEnvironment(currentElement);
      if(env) {
         return env;
      } else {
         currentElement = currentElement.parentElement;
      }
   }
   return null;
}

function fixNotifyArguments(env: IDOMEnvironment,
                            target: Element,
                            relatedTarget: Element,
                            isTabPressed: TTabPressesd): [Element, Element, TTabPressesd] {
   // Пока не смержили правку в ws, не можем поменять сигнатуру функции.
   // Поэтому будем менять в три доброски, с совместимостью в ui
   if (env && env.__captureEventHandler) {
      return [target, relatedTarget, isTabPressed];
   } else {
      // @ts-ignore
      // FIXME: по проекту изменния системы событий
      return [env, target, relatedTarget];
   }
}

/**
 * Вычисляем состояние активности компонентов, и стреляем событием активности у тех компонентов,
 * что поменяли свое состояние
 * @param env
 * @param target - куда пришел фокус
 * @param relatedTarget - откуда ушел фокус
 * @param isTabPressed - true, если фокус перешел по нажатию tab
 */

export function notifyActivationEvents(target: Element,
                                       relatedTarget: Element,
                                       env?: IDOMEnvironment,
                                       isTabPressed?: TTabPressesd): boolean | void {
   [target, relatedTarget, isTabPressed] = fixNotifyArguments(env, target, relatedTarget, isTabPressed);
   if (detectStrangeElement(target)) {
      return;
   }

   // странные элементы вообще проигнорируем, возьмем вместо него предыдущий активный
   const realRelatedTarget = (!detectStrangeElement(relatedTarget) && relatedTarget) ||
      // @ts-ignore
      notifyActivationEvents._savedFocusedElement;

   const
      arrayMaker = goUpByControlTree(target), // Массив активированных компонентов
      relatedArrayMaker = goUpByControlTree(realRelatedTarget); // Массив деактивированных компонентов

   // последний активный элемент, который не странный
   // @ts-ignore
   notifyActivationEvents._savedFocusedElement = target;

   // Вычисляем общего предка
   const mutualTarget = arrayMaker.find(function (target) {
      return relatedArrayMaker.indexOf(target) !== -1;
   });

   let prevControl = null;

   // Меняем состояние у тех компонентов, которые реально потеряли активность
   relatedArrayMaker.find(function (control) {
      let found = undefined;

      if (control !== mutualTarget) {
         let container = control._container;

         // jquery
         if (container && container.hasOwnProperty('length')) {
            container = container[0];
         }

         if (container) {
            // todo каким-то образом фокус улетает в IE на дочерний элемент, а deactivated зовется на его предке
            // https://online.sbis.ru/opendoc.html?guid=3dceaf87-5f2a-4730-a7bc-febe297649c5
            if (container.contains && container.contains(target)) {
               found = false;
            }
            // todo если элемент не в доме, не стреляем для контрола deactivated, потому что он уже удален
            // https://online.sbis.ru/opendoc.html?guid=0a8bd5b7-f809-4571-a6cf-ee605870594e
            // тут перерисовывается popup и фокус слетает сам, потом зовут активацию и relatedTarget берется как
            // savedFocusedElement который уже не в доме, потому что он был на попапе который удалили
            if (!document.body.contains(container)) {
               found = false;
            }
         } else {
            const message = `[UI/_focus/Events:notifyActivationEvents] - Control "${control._moduleName}" has no container!`;
            Logger.warn(message, control);
         }

         if (found === undefined) {
            // не стреляем событием для HOC, события сейчас так работают что если
            // стрельнем событием на контроле, обработчик позовутся и для контрола, и для его хоков.
            // todo надо удалить этот код, если события исправят этот недочет.
            if (!prevControl || control._container !== prevControl._container) {
               control._notify('deactivated', [
                  {
                     // to: arrayMaker[0],
                     // from: relatedArrayMaker[0],
                     isTabPressed: !!isTabPressed,
                     // @ts-ignore
                     isShiftKey: isTabPressed && isTabPressed.isShiftKey
                  }
               ]);
               control._$active = false;
            }
            found = false;
         }

         prevControl = control;
      } else {
         found = true;
      }

      return found;
   });

   prevControl = null;
   // Меняем состояние у тех компонентов, которые реально получили активность
   let found = undefined;
   arrayMaker.find(function (control) {
      if (control !== mutualTarget) {
         // не стреляем событием для HOC, события сейчас так работают что если
         // стрельнем событием на контроле, обработчик позовутся и для контрола, и для его хоков.
         // todo надо удалить этот код, если события исправят этот недочет.
         if (!prevControl || control._container !== prevControl._container) {
            control._notify('activated', [
               {
                  _$to: arrayMaker[0],
                  // from: relatedArrayMaker[0],
                  isTabPressed: !!isTabPressed,
                  // @ts-ignore
                  isShiftKey: isTabPressed && isTabPressed.isShiftKey
               }
            ]);
            control._$active = true;
         }
         found = false;

         prevControl = control;
      } else {
         found = true;
      }

      return found;
   });
   if (!found) {
      let environment = findClosestEnvironment(target);
      if (environment) {
         compatibleActivationEvents(environment, arrayMaker);
      }
   }
}
