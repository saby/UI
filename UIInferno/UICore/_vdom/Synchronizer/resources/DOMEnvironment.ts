/// <amd-module name="UICore/_vdom/Synchronizer/resources/DOMEnvironment" />
// tslint:disable:variable-name no-any ban-ts-ignore

import { detection } from 'Env/Env';
import { Logger, isNewEnvironment } from 'UICore/Utils';
import {ElementFinder, Events, focus, preventFocus, hasNoFocus} from 'UICore/Focus';
import { goUpByControlTree } from 'UICore/NodeCollector';
import { WasabyEvents } from 'UI/Events';
import {
   IDOMEnvironment, TControlStateCollback,
   TMarkupNodeDecoratorFn, IHandlerInfo, TModifyHTMLNode,
   TComponentAttrs,
   IControlNode
} from '../interfaces';

import { mapVNode } from './VdomMarkup';
import { setControlNodeHook, setEventHook } from './Hooks';
import Environment from './Environment';
import { VNode } from 'Inferno/third-party/index';

/**
 * TODO: Изыгин
 * https://online.sbis.ru/opendoc.html?guid=6b133510-5ff0-4970-8540-d5be30e7587b&des=
 * Задача в разработку 01.06.2017 Поднять юнит тестирование VDOM Обеспечить покрытие тестами и прозрачность кода файлов
 */

/**
 * @author Кондаков Р.Н.
 */

function createRecursiveVNodeMapper(fn: any): any {
   return function recursiveVNodeMapperFn(
      tagName: VNode['type'],
      properties: VNode['props'],
      children: VNode['children'],
      key: VNode['key'],
      controlNode: any,
      ref: VNode['ref']
   ): any {
      let childrenRest;
      let fnRes = fn(tagName, properties, children, key, controlNode, ref);
      const newChildren = fnRes[2];

      childrenRest = newChildren.map(
         (child: VNode) => {
            return mapVNode(recursiveVNodeMapperFn, controlNode, child);
         }
      );
      fnRes = [fnRes[0], fnRes[1], childrenRest, fnRes[3], fnRes[4]];

      return fnRes;
   };
}

const TAB_KEY = 9;

// @ts-ignore FIXME: Class 'DOMEnvironment' incorrectly implements interface IDOMEnvironment
export default class DOMEnvironment extends Environment implements IDOMEnvironment {
   // FIXME: костыль для UI\_focus\RestoreFocus.ts
   _restoreFocusState: boolean = false;
   private __markupNodeDecorator: TMarkupNodeDecoratorFn;
   private eventSystem;
   _isTabPressed: null | {
      isShiftKey: boolean
      tabTarget: HTMLElement
   };

   constructor(
      // она нужна что бы выполнить функцию render VDOM библиотеки от неё
      _rootDOMNode: TModifyHTMLNode,
      controlStateChangedCallback: TControlStateCollback,
      rootAttrs: TComponentAttrs
   ) {
      super(_rootDOMNode, controlStateChangedCallback);

      this.__markupNodeDecorator = createRecursiveVNodeMapper(setEventHook);

      this._handleTabKey = this._handleTabKey.bind(this);
      this.eventSystem = new WasabyEvents(_rootDOMNode, this as unknown as IDOMEnvironment, this._handleTabKey);

      this.initFocusHandlers();
      this.__initBodyTabIndex();

   }

   destroy(): any {
      this.eventSystem.destroy();
      super.destroy();
   }

   protected callEventsToDOM(): void {
      this.eventSystem.callEventsToDOM();
   }

   private initFocusHandlers(): any {
      this.eventSystem.handleSpecialEvent('focus', this._handleFocusEvent, this);
      this.eventSystem.handleSpecialEvent('blur', this._handleBlurEvent, this);
      this.eventSystem.handleSpecialEvent('mousedown', this._handleMouseDown, this);
   }

   private __initBodyTabIndex(): any {
      // разрешаем фокусироваться на body, чтобы мы могли зафиксировать
      // уход фокуса из vdom-окружения и деактивировать компоненты
      if (!isNewEnvironment() && typeof window !== 'undefined') {
         document.body.tabIndex = 0;
      }
   }

   /**
    * Обработчик клавиши tab.
    * Логика работы tab отличается от остальных клавишь, т.к. используется в системе фокусов,
    * но система событий ничего не должна знать о системы фокусов, поэтому обработчик одтаем в качестве аргумента
    * @param event - событие клавиатуры
    * @param tabKeyHandler - обработчик, который вызывается по нажатию tab
    */
   private _handleTabKey(event: any): void {
      if (!this._rootDOMNode) {
         return;
      }
      // Костыльное решение для возможности использовать Tab в нативной системе сторонних плагинов
      // В контроле объявляем свойство _allowNativeEvent = true
      // Необходимо проверить все контрол от точки возникновения события до body на наличие свойства
      // т.к. возможно событие было вызвано у дочернего контрола для которого _allowNativeEvent = false
      // FIXME дальнейшее решение по задаче
      // FIXME https://online.sbis.ru/opendoc.html?guid=b485bcfe-3680-494b-b6a7-2850261ef1fb
      const checkForNativeEvent = goUpByControlTree(event.target);
      for (let i = 0; i < checkForNativeEvent.length - 1; i++) {
         if (checkForNativeEvent[i].hasOwnProperty('_allowNativeEvent') &&
             checkForNativeEvent[i]._allowNativeEvent) {
            return;
         }
      }

      if (event.keyCode === TAB_KEY) {
         let next;
         let res;
         next = ElementFinder.findWithContexts(
             this._rootDOMNode,
             event.target,
             !!event.shiftKey,
             ElementFinder.getElementProps,
             true
         );

         // Store the tab press state until the next step. _isTabPressed is used to determine if
         // focus moved because of Tab press or because of mouse click. It also stores the shift
         // key state and the target that received the tab event.
         this._isTabPressed = {
            isShiftKey: !!event.shiftKey,
            tabTarget: event.target
         };
         setTimeout(() => { this._isTabPressed = null; }, 0);

         if (next) {
            if (next.wsControl && next.wsControl.setActive) {
               next.wsControl.setActive(true);
            } else {
               focus(next);
            }
            event.preventDefault();
            event.stopImmediatePropagation();
         } else {
            if (this._rootDOMNode.wsControl) {
               res = this._rootDOMNode.wsControl._oldKeyboardHover(event);
            }
            if (res !== false) {
               // !!!!
               // this._lastElement.focus(); чтобы выйти из рута наружу, а не нативно в другой элемент внутри рута
               // тут если с шифтом вероятно нужно прокидывать в firstElement чтобы из него выйти
            } else {
               event.preventDefault();
               event.stopImmediatePropagation();
            }
         }
      }
   }


   _handleFocusEvent(e: any): any {
      if (this._restoreFocusState) {
         return;
      }

      saveValueForChangeEvent(e.target);

      // запускаем обработчик только для правильного DOMEnvironment, в который прилетел фокус
      if (this._rootDOMNode && this._rootDOMNode.contains(e.target)) {
         // @ts-ignore FIXME: Class 'DOMEnvironment' incorrectly implements interface IDOMEnvironment
         Events.notifyActivationEvents(e.target, e.relatedTarget, this, this._isTabPressed);
      }
   }

   _handleBlurEvent(e: any): any {
      if (this._restoreFocusState) {
         return;
      }

      let target;
      let relatedTarget;

      if (detection.isIE) {
         // В IE баг, из-за которого input не стреляет событием change,
         // если перед уводом фокуса поменять value из кода
         // Поэтому стреляем событием вручную
         fireChange(e);

         if (e.relatedTarget === null) {
            // в IE есть баг что relatedTarget вообще нет,
            // в таком случае возьмем document.body,
            // потому что фокус уходит на него.
            relatedTarget = document.activeElement;
         }
      }

      // todo для совместимости.
      // если в старом окружении фокус на vdom-компоненте, и фокус уходит в старое окружение - стреляем
      // событиями deactivated на vdom-компонентах с которых уходит активность
      // https://online.sbis.ru/opendoc.html?guid=dd1061de-e519-438e-915d-3359290495ab
      target = e.target;
      relatedTarget = relatedTarget || e.relatedTarget;
      if (!isNewEnvironment() && relatedTarget) {

         // если у элемента, куда уходит фокус, сверху есть vdom-окружение, deactivated стрельнет в обработчике фокуса
         // иначе мы уходим непонятно куда и нужно пострелять deactivated
         const isVdom = isVdomEnvironment(relatedTarget);
         if (!isVdom) {
            // @ts-ignore FIXME: Class 'DOMEnvironment' incorrectly implements interface IDOMEnvironment
            Events.notifyActivationEvents(relatedTarget, target, this, this._isTabPressed);
         }
      }
   }

   _handleMouseDown(e: any): any {
      const preventDefault = e.preventDefault;
      e.preventDefault = function(): any {
         if (!hasNoFocus(this.target)) {
            // не могу стрелять error, в интеграционных тестах попапы тоже зовут preventDefault
            Logger.warn('Вызван preventDefault у события mousedown в обход атрибута ws-no-focus!');
         }
         return preventDefault.apply(this, arguments);
      };
      preventFocus(e);
   }

   decorateFullMarkup(vnode: VNode | VNode[], controlNode: IControlNode): any {
      if (Array.isArray(vnode)) {
         vnode = vnode[0];
      }
      return mapVNode(setControlNodeHook, controlNode, vnode, true);
   }

   getMarkupNodeDecorator(): any {
      return this.__markupNodeDecorator;
   }

   /*
      DOMEnvironment можно уничтожить, если dom-элемент, за которым он закреплен, уже уничтожен,
      либо не осталось ни одного контрола, прикрепленного к корневому dom-элементу,
      либо уничтожается корневой контрол, закрепленный за этим окружением
   */
   _canDestroy(destroyedControl: any): any {
      return (
         !this._rootDOMNode ||
         !this._rootDOMNode.controlNodes ||
         !this._rootDOMNode.controlNodes.find(
            (node: any): any => !node.parent && node.control !== destroyedControl
         )
      );
   }

   showCapturedEvents(): Record<string, IHandlerInfo[]> {
      return this.eventSystem.showCapturedEventHandlers();
   }
}

function fireChange(blurEvent: any): any {
   const oldValue = blurEvent.target._cachedValue;
   const currentValue = blurEvent.target.value;
   let e;
   if (oldValue !== undefined && oldValue !== currentValue) {
      if (detection.isIE12) {
         e = new Event('change');
      } else {
         e = document.createEvent('Event');
         e.initEvent('change', true, true);
      }
      (e as any)._dispatchedForIE = true;
      blurEvent.target.dispatchEvent(e);
   }
   blurEvent.target._cachedValue = undefined;
}

/**
 * Сохраняем value на input'е. Это необходимо из-за особенностей работы vdom.
 * При перерисовке мы для input'ов выполним
 * node.value = value. Из-за этого в EDGE событие change не стрельнет,
 * потому что браузер не поймет, что текст поменялся.
 * Поэтому в EDGE будем стрелять событием change вручную
 * @param domNode - input
 */
function saveValueForChangeEvent(domNode: any): any {
   if (detection.isIE) {
      domNode._cachedValue = domNode.value;
   }
}

function isVdomEnvironment(sourceElement: any): any {
   // если сам элемент содержит controlNodes, значит точно vdom окружение
   if (sourceElement.controlNodes) {
      return true;
   }
   // если какой-то из элементов предков содержит controlNodes, значит тоже vdom окружение
   while (sourceElement.parentNode) {
      sourceElement = sourceElement.parentNode;
      if (sourceElement.controlNodes) { return true; }
   }
   // элемент находится не во vdom окружении
   return false;
}
