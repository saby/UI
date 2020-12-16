/// <amd-module name="UI/_vdom/Synchronizer/resources/DOMEnvironment" />
// tslint:disable:variable-name no-any ban-ts-ignore

import { constants, detection } from 'Env/Env';
import { Logger, isNewEnvironment } from 'UI/Utils';
import { ElementFinder, Events, BoundaryElements, focus, preventFocus, hasNoFocus, goUpByControlTree } from 'UI/Focus';
import {
   IDOMEnvironment, TControlStateCollback, IArrayEvent,
   IWasabyHTMLElement, TMarkupNodeDecoratorFn, IHandlerInfo, TModifyHTMLNode,
   TComponentAttrs,
   IMemoNode,
   IControlNode
} from '../interfaces';

import { delay } from 'Types/function';
import { mapVNode } from './VdomMarkup';
import { setControlNodeHook, setEventHook } from './Hooks';
import SyntheticEvent from './SyntheticEvent';
import { EventUtils } from 'UI/Events';
import { RawMarkupNode } from 'UI/Executor';
import Environment from './Environment';
import { SwipeController } from './SwipeController';
import { LongTapController } from './LongTapController';
import {
   onEndSync
} from 'UI/DevtoolsHook';
import { VNode, render } from 'Inferno/third-party/index';
import { hydrate } from 'Inferno/third-party/hydrate';

import isInvisibleNode from './InvisibleNodeChecker';
import MountMethodsCaller from './MountMethodsCaller';

/**
 * TODO: Изыгин
 * https://online.sbis.ru/opendoc.html?guid=6b133510-5ff0-4970-8540-d5be30e7587b&des=
 * Задача в разработку 01.06.2017 Поднять юнит тестирование VDOM Обеспечить покрытие тестами и прозрачность кода файлов
 */

/**
 * @author Кондаков Р.Н.
 */

function checkAssertion(assert: boolean, message?: string): any {
   if (assert) {
      return;
   }
   throw new Error(message || 'Ошибка логики');
}

const TAB_KEY = 9;
let touchId = 0;

const mountMethodsCaller: MountMethodsCaller = new MountMethodsCaller();

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

function atLeastOneControlReduce(prev: any, next: any): any {
   return next.control;
}

function atLeasOneControl(controlNodes: any): any {
   return controlNodes.reduce(atLeastOneControlReduce, true);
}

function generateClickEventFromTouchend(event: TouchEvent): any {
   let touch: any = event.changedTouches && event.changedTouches[0];
   if (!touch) {
      touch = {
         clientX: 0,
         clientY: 0,
         screenX: 0,
         screenY: 0
      };
   }

   // We do not use document.createEvent or new MouseEvent to make an
   // actual event object, because in that case we can not change
   // the target - target property is non-configurable in some
   // browsers.
   // We create a simple object instead and fill in the fields we might
   // need.
   return {
      type: 'click',
      bubbles: event.bubbles,
      cancelable: event.cancelable,
      view: window,
      detail: 1,
      screenX: touch.screenX,
      screenY: touch.screenY,
      clientX: touch.clientX,
      clientY: touch.clientY,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      button: 0,
      buttons: 0,
      relatedTarget: null,
      target: event.target,
      currentTarget: event.currentTarget,
      eventPhase: 1, // capture phase
      stopPropagation(): void {
         this.bubbles = false;
      },
      preventDefault(): void {
         // no action
      }
   };
}

const clickStateTarget: Array<{ target: HTMLElement, touchId: number }> = [];
const callAfterMount: IArrayEvent[] = [];

class QueueMixin extends Environment {
   private queue: string[] = null;

   /**
    * Кейс: в панели идет перерисовка. Панель что-то сообщает опенеру
    * опенер передает данные в контрол, который лежит вне панели
    * контрол дергает _forceUpdate и попадает в очередь перерисовки панели
    * затем панель разрушается и заказанной перерисовки контрола вне панели не случается
    */
   runQueue(): void {
      if (this.queue) {
         for (let i = 0; i < this.queue.length; i++) {
            this.forceRebuild(this.queue[i]);
         }
      }
      this.queue = null;
   }
}

interface IDires {
   [key: string]: number;
}

// @ts-ignore FIXME: Class 'DOMEnvironment' incorrectly implements interface IDOMEnvironment
export default class DOMEnvironment extends QueueMixin implements IDOMEnvironment {
   // FIXME: костыль для Synchronizer и DirtyChecking
   _currentDirties: IDires;
   // FIXME: костыль для UI\_focus\RestoreFocus.ts
   _restoreFocusState: boolean = false;
   // FIXME: костыль для Synchronizer
   _nextDirties: IDires;

   // FIXME вернуть private
   __captureEventHandler: Function;
   private __captureEventHandlers: Record<string, IHandlerInfo[]>;
   private __markupNodeDecorator: TMarkupNodeDecoratorFn;
   private touchendTarget: HTMLElement;

   _rebuildRequestStarted: boolean = false;
   _haveRebuildRequest: boolean = false;

   private _clickState: any = {
      detected: false,
      stage: '',
      timer: undefined,
      timeout: 500,
      target: null,
      touchCount: 0,
      timeStart: undefined
   };

   _isTabPressed: null | {
      isShiftKey: boolean
      tabTarget: HTMLElement
   };

   constructor(
      // она нужна что бы выполнить функцию render VDOM библиотеки от неё
      public _rootDOMNode: TModifyHTMLNode,
      controlStateChangedCallback: TControlStateCollback,
      rootAttrs: TComponentAttrs
   ) {
      // @ts-ignore FIXME: Expected 1 argument but got 2
      super(controlStateChangedCallback, rootAttrs);
      // @ts-ignore FIXME: Condition
      checkAssertion(_rootDOMNode !== document, 'Корневой контрол нельзя монтировать на document');
      this._currentDirties = {};
      this._nextDirties = {};
      this.__captureEventHandlers = {};
      this.__captureEventHandler = captureEventHandler.bind(this);
      this.__markupNodeDecorator = createRecursiveVNodeMapper(setEventHook);
      this.initProcessingHandlers();
      this._handleTabKey = this._handleTabKey.bind(this);

      this.__initBodyTabIndex();

      // если я это не напишу, ts ругнется 'touchendTarget' is declared but its value is never read
      this.touchendTarget = this.touchendTarget || null;
   }

   destroy(): any {
      this.runQueue();

      // @ts-ignore FIXME: Property '_haveRebuildRequest' does not exist
      this._haveRebuildRequest = false;
      this.removeTabListener();
      // TODO раскомментить после https://online.sbis.ru/opendoc.html?guid=450170bd-6322-4c3c-b6bd-3520ce3cba8a
      // this.removeProcessiingEventHandler('focus');
      // this.removeProcessiingEventHandler('blur');
      // this.removeProcessiingEventHandler('mousedown');
      // this.removeProcessiingEventHandler('click');
      // this.removeProcessiingEventHandler('touchstart');
      // this.removeProcessiingEventHandler('touchmove');
      // this.removeProcessiingEventHandler('touchend');
      this.removeAllCaptureHandlers();
      this._rootDOMNode = undefined;
      this._currentDirties = {};
      this._nextDirties = {};
      this.__captureEventHandlers = {};
      delete this.__captureEventHandler;
      this._handleTabKey = undefined;
      super.destroy();
   }

   initProcessingHandlers(): any {
      this.addCaptureProcessingHandler('focus', this._handleFocusEvent);
      this.addCaptureProcessingHandler('blur', this._handleBlurEvent);
      this.addCaptureProcessingHandler('mousedown', this._handleMouseDown);
      this.addCaptureProcessingHandler('click', this._handleClick);
      this.addCaptureProcessingHandler('touchstart', this._handleTouchstart);
      this.addCaptureProcessingHandler('touchmove', this._handleTouchmove);
      this.addCaptureProcessingHandler('touchend', this._handleTouchend);
   }

   private __initBodyTabIndex(): any {
      // разрешаем фокусироваться на body, чтобы мы могли зафиксировать
      // уход фокуса из vdom-окружения и деактивировать компоненты
      if (!isNewEnvironment() && typeof window !== 'undefined') {
         document.body.tabIndex = 0;
      }
   }

   _handleTabKey(event: any): any {
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

      let next;
      let res;
      if (event.keyCode === TAB_KEY) {
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

   addTabListener(): any {
      if (this._rootDOMNode) { this._rootDOMNode.addEventListener('keydown', this._handleTabKey, false); }
   }

   removeTabListener(): any {
      if (this._rootDOMNode) { this._rootDOMNode.removeEventListener('keydown', this._handleTabKey, false); }
   }

   _handleFocusEvent(e: any): any {
      if (this._restoreFocusState) {
         return;
      }

      saveValueForChangeEvent(e.target);

      // запускаем обработчик только для правильного DOMEnvironment, в который прилетел фокус
      if (this._rootDOMNode && this._rootDOMNode.contains(e.target)) {
         // @ts-ignore FIXME: Class 'DOMEnvironment' incorrectly implements interface IDOMEnvironment
         Events.notifyActivationEvents(this, e.target, e.relatedTarget, this._isTabPressed);
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
            Events.notifyActivationEvents(this, relatedTarget, target, this._isTabPressed);
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

   // TODO: удалить после обновление хрома до 81 версии
   _getChromeVersion(): number {
      const raw: RegExpMatchArray | false = navigator && navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
      return raw ? parseInt(raw[2], 10) : 0;
   }

   _handleClick(event: any): any {
      if (this._shouldUseClickByTap()) {
         const idx = getClickStateIndexForTarget(fixSvgElement(event.target));
         // if click event occurred, we can remove monitored target
         if (idx > -1) {
            clickStateTarget.splice(idx, 1);
         }
      }

      /**
       * Firefox right click bug
       * https://bugzilla.mozilla.org/show_bug.cgi?id=184051
       */
      if (event.button === 2) {
         event.stopPropagation();
         return;
      }

      /**
       * Break click by select.
       */
      const selection = window && window.getSelection ? window.getSelection() : null;

      // Break click on non-empty selection with type "Range".
      // Have to trim because of fake '\n' selection in some cases.
      const hasSelection = selection && selection.type === 'Range' && event.target.contains(selection.focusNode);
      const userSelectIsNone = window && window.getComputedStyle
         ? window.getComputedStyle(event.target)['user-select'] === 'none'
         : true;
      const isTargetNotEmpty = window && event.target.textContent.trim().length > 0;
      if (hasSelection && !userSelectIsNone && isTargetNotEmpty) {
         event.stopImmediatePropagation();
         return;
      }
   }

   _handleTouchstart(event: any): any {
      if (this._shouldUseClickByTap()) {
         // Для svg запоминаем ownerSVGElement, т.к. иногда в touchstart таргет - это тег svg,
         // при этом у события click, таргетом будет внутренний элемент
         const target = fixSvgElement(event.target);
         clickStateTarget.push({
            target,
            touchId: touchId++ // записываем номер текущего касания
         });
      }

      // Compatibility. Touch events handling in Control.compatible looks for
      // the `addedToClickState` flag to see if the event has already been
      // processed. Since vdom has already handled this event, set this
      // flag to true to avoid event triggering twice.
      event.addedToClickState = true;

      SwipeController.initState(event);
      LongTapController.initState(event);
   }
   _handleTouchmove(event: any): any {
      if (this._shouldUseClickByTap()) {
         this._clickState.touchCount++;
         // Only one touchmove event is allowed between touchstart and touchend events on Ipad.
         // If more than one touchmove did occurred, we don't emulate click event.
         // But on windows installed devices touchmove event can occur some times,
         // therefore we must check if touchmove count more than 1.
         if (this._clickState.touchCount > 3) {
            const idx = getClickStateIndexForTarget(fixSvgElement(event.target));
            if (idx > -1) {
               clickStateTarget.splice(idx, 1);
            }
         }
      }

      SwipeController.detectState(event);
      LongTapController.resetState();
   }

   _handleTouchend(event: any): any {
      if (this._shouldUseClickByTap()) {
         const lastTouchId = touchId;
         this._clickState.touchCount = 0;
         // click occurrence checking
         setTimeout(() => {
            // Вызываем клик, если клик был не вызван автоматически после touchEnd. Такое иногда
            // происходит на тач-телевизорах и планшетах на Windows, и в ограниченной версии
            // вебкита, используемой например в Presto Offline.
            // Для того чтобы понять, нужно ли нам эмулировать клик, проверяем два условия:
            // 1. Элемент, на котором сработал touchEnd, есть в массиве clickStateTarget
            //    (туда они добавляются при touchStart, и удаляются, если на этом элементе
            //    срабатывает touchMove или click)
            // 2. Если этот элемент там есть, проверяем что он соответствует именно тому touchStart,
            //    который является парным для этого touchEnd. Это можно определить по номеру касания
            //    touchId. Это предотвращает ситуации, когда мы быстро нажимаем на элемент много
            //    раз, и этот setTimeout, добавленный на первое касание, находит в массиве clickStateTarget
            //    тот же элемент, но добавленный на сотое касание.
            const idx = getClickStateIndexForTarget(fixSvgElement(event.target));
            if (idx > -1 && clickStateTarget[idx].touchId < lastTouchId) {
               // If the click did not occur, we emulate the click through the
               // vdom environment only (so that the old WS3 environment ignores it).
               // To do so, we generate the fake click event object based on the data
               // from the touchend event and propagate it using the vdom bubbling.
               const clickEventObject = generateClickEventFromTouchend(event);
               this._handleClick(clickEventObject);
               this.__captureEventHandler(clickEventObject);
            }
         }, this._clickState.timeout);
      }

      // Compatibility. Touch events handling in Control.compatible looks for
      // the `addedToClickState` flag to see if the event has already been
      // processed. Since vdom has already handled this event, set this
      // flag to true to avoid event triggering twice.
      event.addedToClickState = true;

      // есть ситуации когда в обработчик клика летит неправильный таргет в мобильном сафари
      // причину выяснить не удалось так что буду брать таргет из touchend
      // https://online.sbis.ru/opendoc.html?guid=a6669e05-8810-479f-8860-bc0d4f5c220e
      // https://online.sbis.ru/opendoc.html?guid=b0f15e03-3672-4be6-8a49-2758bb4c34d7
      // https://online.sbis.ru/opendoc.html?guid=f7e7811b-f093-4964-9838-0f735c97670e
      // https://online.sbis.ru/opendoc.html?guid=076215f4-2cff-4242-a3ff-70f090bfacdd
      // https://online.sbis.ru/opendoc.html?guid=79fc9323-05de-421e-b4ac-bc79ad6c775d
      // https://online.sbis.ru/opendoc.html?guid=911984fb-1757-4f62-999f-600bec2305c0
      // https://online.sbis.ru/opendoc.html?guid=f0695304-83e2-4cc5-b0b3-a63580214bf2
      // https://online.sbis.ru/opendoc.html?guid=99861178-2bd8-40dc-8307-bda1080a91f5
      this.touchendTarget = event.target;
      setTimeout(() => { this.touchendTarget = null; }, 300);

      SwipeController.resetState();
      LongTapController.resetState();
   }

   _shouldUseClickByTap(): any {
      // In chrome wrong target comes in event handlers of the click events on touch devices.
      // It occurs on the TV and the Windows tablet. Presto Offline uses limited version of WebKit
      // therefore the browser does not always generate clicks on the tap event.
      return (
         constants.browser.isDesktop ||
         (constants.compatibility.touch &&
            constants.browser.chrome &&
            navigator &&
            navigator.userAgent.indexOf('Windows') > -1)
      );
   }

   applyNodeMemo(rebuildMemoNode: IMemoNode): void {
      if (!this._rootDOMNode) {
         return;
      }

      const newNode: IControlNode = rebuildMemoNode.value;
      // @ts-ignore
      if (!!newNode?.control?._parent?.isDestroyed()) {
         return;
      }
      if (!newNode.fullMarkup || !this._haveRebuildRequest) {
         if (typeof console !== 'undefined') {
            // tslint:disable:no-console
            console.warn("node haven't fullMarkup", new Error().stack);
         }
         return;
      }

      const rebuildChanges = rebuildMemoNode.getNodeIds();
      const vnode = newNode.fullMarkup;
      let control;
      const newRootDOMNode = undefined;

      // добавляем vdom-focus-in и vdom-focus-out
      // @ts-ignore FIXME: Class 'DOMEnvironment' incorrectly implements interface IDOMEnvironment
      BoundaryElements.insertBoundaryElements(this, vnode);

      const controlNodesToCall = mountMethodsCaller.collectControlNodesToCall(newNode, rebuildChanges);
      mountMethodsCaller.beforeRender(controlNodesToCall);

      this._rootDOMNode.isRoot = true;
      try {
         // Свойство $V вешает движок inferno. Если его нет, значит пришли с сервера.
         if (this._rootDOMNode.hasOwnProperty('$V') || !this._rootDOMNode.firstChild) {
            render(vnode, this._rootDOMNode, undefined, undefined, true);
         } else {
            hydrate(vnode, this._rootDOMNode, undefined, true);
         }
      } catch (e) {
         Logger.error('Ошибка оживления Inferno', undefined, e);
      }

      // @ts-ignore
      const isCompatible = newNode.control.hasCompatible && newNode.control.hasCompatible();
      if (isCompatible) {
         control = atLeasOneControl([newNode]);
         if (newRootDOMNode) {
            // @ts-ignore FIXME: Unknown $
            control._container = window.$ ? $(newRootDOMNode) : newRootDOMNode;
         }
         mountMethodsCaller.componentDidUpdate(controlNodesToCall);
         mountMethodsCaller.beforePaint(controlNodesToCall);
         delay(() => {
            // останавливать должны, только если запущено, иначе получается так,
            // что это предыдущая фаза синхронизации и она прерывает следующую
            // то есть, если  _haveRebuildRequest=true а _rebuildRequestStarted=false
            // это значит, что мы запланировали перерисовку, но она еще не началась
            // В случае если мы ждем завершения асинхронных детей и перестроение уже закончены
            // нужно убрать запрос на реквест, чтобы дети рутовой ноды могли перерисовываться независимо
            // @ts-ignore FIXME: Property '_rebuildRequestStarted' does not exist
            if (this._rebuildRequestStarted) {
               // @ts-ignore FIXME: Property '_haveRebuildRequest' does not exist
               this._haveRebuildRequest = false;
            }

            if (!control._destroyed) {
               if (typeof control.reviveSuperOldControls === 'function') {
                  control.reviveSuperOldControls();
               }
            }
            mountMethodsCaller.afterUpdate(mountMethodsCaller.collectControlNodesToCall(newNode, rebuildChanges));

            this._rebuildRequestStarted = false;
            this.runQueue();
            onEndSync(newNode.rootId);
         });

         return;
      }

      // @ts-ignore FIXME: Properties '_haveRebuildRequest' and '_asyncOngoing' do not exist
      if (this._rebuildRequestStarted || this._asyncOngoing === false) {
         // @ts-ignore FIXME: Property '_haveRebuildRequest' does not exist
         this._haveRebuildRequest = false;
      }

      mountMethodsCaller.afterRender(controlNodesToCall);
      mountMethodsCaller.beforePaint(controlNodesToCall);
      // используется setTimeout вместо delay, т.к. delay работает через rAF
      // rAF зовётся до того, как браузер отрисует кадр,
      //    а _afterUpdate должен вызываться после, чтобы не вызывать forced reflow.
      // Если делать то же самое через rAF, то нужно звать rAF из rAF, это и дольше, и неудобно.
      setTimeout(() => {
         mountMethodsCaller.componentDidUpdate(controlNodesToCall);
         while (callAfterMount && callAfterMount.length) {
            const elem = callAfterMount.shift();
            const fn = elem.fn;
            /* в слое совместимости контрол внутри которого построился wasaby-контрол, может быть уничтожен
               до того как начнется асинхронный вызов afterMount,
               как результат в текущей точку контрол будет уже уничтожен слоем совместимости
               нало проверять действительно ли он жив, перед тем как выстрелить событием
               */
            // @ts-ignore
            if (!fn.control._destroyed) {
               fn.apply(fn.control, elem.finalArgs);
            }
         }
         onEndSync(newNode.rootId);
         this._rebuildRequestStarted = false;
         this.runQueue();
      }, 0);
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

   getDOMNode(): HTMLElement {
      return this._rootDOMNode;
   }

   /**
    * Создается объект кастомного события с указанными в notify параметрами и вызывается функция его распространения
    * Возвращает результат выполнения последнего обработчика
    * @param controlNode
    * @param args
    */
   startEvent(controlNode: any, args: any): any {
      const eventName = args[0].toLowerCase();
      const handlerArgs = args[1] || [];
      const eventDescription = args[2];
      const eventConfig = {};
      let eventObject;
      // @ts-ignore FIXME: Property '_bubbling' does not exist
      eventConfig._bubbling =
         eventDescription && eventDescription.bubbling !== undefined ? eventDescription.bubbling : false;
      // @ts-ignore FIXME: Property 'type' does not exist
      eventConfig.type = eventName;
      // @ts-ignore FIXME: Property 'target' does not exist
      eventConfig.target = controlNode.element;
      // @ts-ignore FIXME: Property 'target' does not exist
      if (!eventConfig.target) {
         if (
            !(controlNode.fullMarkup instanceof RawMarkupNode) &&
            !isInvisibleNode(controlNode, true)
         ) {
            Logger.error('Event ' + eventName + ' has emited before mounting to DOM', controlNode);
         }
         return;
      }
      const startArray = getEventPropertiesStartArray(controlNode, eventName);
      // @ts-ignore FIXME: Argument 'eventConfig' of type {} is not assignable to parameter of type IEventConfig
      eventObject = new SyntheticEvent(null, eventConfig);
      vdomEventBubbling(eventObject, controlNode, startArray, handlerArgs, false);
      return eventObject.result;
   }

   private __getWindowObject(): any {
      return window;
   }

   getHandlerInfo(eventName: string, processingHandler: boolean, bodyEvent: boolean): any {
      const handlers = this.__captureEventHandlers;
      if (handlers[eventName]) {
         for (let i = 0; i < handlers[eventName].length; i++) {
            if (handlers[eventName][i].processingHandler === processingHandler &&
               handlers[eventName][i].bodyEvent === bodyEvent) {
               return handlers[eventName][i];
            }
         }
      }
      return null;
   }

   /**
    * Добавление обработчика на фазу захвата.
    * Для системы событий есть два вида обработчиков на фазу захвата:
    * 1. Обработчик, который добавили просто потому,
    * что кто-то подписался на такое событие через on:eventName="handler()".
    * Такие обработчики помечаем как processingHandler:false.
    * 2. Обработчик, который мы добавляем в конструкторе DOMEnvironment. Такие обработчики нужны,
    * потому что некоторые события необходимо обработать в самой системе событий, а не в контроле.
    * Например, события touchmove, touchstart и touchend. Их необходимо обработать, потому что система событий wasaby
    * умеет распознавать два других типа тач-событий: longtap и swipe. Для таких событий processingHandler:true
    * @param {string} eventName - имя событий
    * @param {boolean} isBodyElement - TODO: describe function parameter
    * @param {Function} handler - функция обработчик
    * @param {boolean} processingHandler - необходим ли этот обработчик
    *  для самой системы событий, или же только для контролов.
    * Будет true, если необходим для системы событий.
    */
   addHandler(eventName: any, isBodyElement: boolean, handler: Function, processingHandler: boolean): any {
      let elementToSubscribe;
      let bodyEvent;
      if (isBodyElement && EventUtils.isSpecialBodyEvent(eventName)) {
         elementToSubscribe = this.__getWindowObject();
         bodyEvent = true;
      } else {
         elementToSubscribe = this._rootDOMNode.parentNode;
         bodyEvent = false;
      }
      const nativeEventName = EventUtils.fixUppercaseDOMEventName(eventName);
      const handlers = this.__captureEventHandlers;
      const handlerInfo = this.getHandlerInfo(eventName, processingHandler, bodyEvent);
      if (handlerInfo === null) {
         let listenerCfg: any = { capture: true };
         const newHandlerInfo: any = { handler, bodyEvent: false, processingHandler };
         listenerCfg = fixPassiveEventConfig(eventName, listenerCfg);
         newHandlerInfo.bodyEvent = bodyEvent;
         if (!processingHandler) {
            newHandlerInfo.count = 1;
         }
         if (!handlers[eventName]) {
            handlers[eventName] = [];
         }
         handlers[eventName].push(newHandlerInfo);
         // @ts-ignore FIXME: Argument 'handler' of type Function is not assignable to parameter of type EventListener
         this.addNativeListener(elementToSubscribe, handler, nativeEventName, listenerCfg);
      } else {
         if (!handlerInfo.processingHandler) {
            handlerInfo.count++;
         }
      }
   }

   addNativeListener(element: HTMLElement, handler: EventListener, eventName: string, config: any): void {
      element.addEventListener(eventName, handler, config);
   }

   /**
    * Удаление обработчика на фазу захвата
    * @param {string} eventName - имя события
    * @param {boolean} isBodyElement - TODO: describe function parameter
    * @param {boolean} processingHandler - необходим ли этот обработчик
    *  для самой системы событий, или же только для контролов.
    * Будет true, если необходим для системы событий.
    */
   removeHandler(eventName: string, isBodyElement: boolean, processingHandler: boolean = false): any {
      let elementToSubscribe;
      let bodyEvent;
      if (isBodyElement && EventUtils.isSpecialBodyEvent(eventName)) {
         elementToSubscribe = this.__getWindowObject();
         bodyEvent = true;
      } else {
         elementToSubscribe = this._rootDOMNode.parentNode;
         bodyEvent = false;
      }
      const nativeEventName = EventUtils.fixUppercaseDOMEventName(eventName);
      const handlers = this.__captureEventHandlers;
      const handlerInfo = this.getHandlerInfo(eventName, processingHandler, bodyEvent);
      if (handlerInfo !== null) {
         if (!handlerInfo.processingHandler) {
            if (handlerInfo.count === 1) {
               this.removeNativeListener(elementToSubscribe, handlerInfo.handler, nativeEventName, true);
               handlers[eventName].splice(handlers[eventName].indexOf(handlerInfo), 1);
            } else {
               handlerInfo.count--;
            }
         } else if (processingHandler) {
            this.removeNativeListener(elementToSubscribe, handlerInfo.handler, nativeEventName, true);
            handlers[eventName].splice(handlers[eventName].indexOf(handlerInfo), 1);
         }
      }
   }

   removeNativeListener(
      element: Node | Window,
      handler: EventListener,
      eventName: string,
      capture: boolean = false
   ): any {
      element.removeEventListener(eventName, handler, capture);
   }

   addCaptureEventHandler(eventName: any, element: any): any {
      // В IE в слое совместимости дикая асинхронность,
      // что приводит к тому, что подписка начинает вызываться для компонентов,
      // которые уже удалены из ДОМА механизмами CompoundControl
      if (this._rootDOMNode.parentNode) {
         this.addHandler(eventName, isBodyElement(element), this.__captureEventHandler, false);
      }
   }

   addCaptureProcessingHandler(eventName: any, method: any): any {
      if (this._rootDOMNode.parentNode) {
         const handler = function(e: any): any {
            if (!isMyDOMEnvironment(this, e)) {
               return;
            }
            method.apply(this, arguments);
         }.bind(this);
         this.addHandler(eventName, false, handler, true);
      }
   }

   removeCaptureEventHandler(eventName: string, element: IWasabyHTMLElement): any {
      // TODO раскомментить после https://online.sbis.ru/opendoc.html?guid=450170bd-6322-4c3c-b6bd-3520ce3cba8a
      // Сейчас есть проблемы с вызовом ref-ов. Рефы на удаление событий вызываются большее количество раз,
      // чем на добавление событий. Это приводит к тому, что обработчики на capture-фазу могут удаляться,
      // когда еще есть активные подписки на события. Поэтому мы будем удалять обработчики на capture-фазу
      // только при дестрое самого DOMEnvironment. Последствиями такого решения будет то, что в редких случаях,
      // система событий будет распространять событие по DOM-у, несмотря на то, что мы заведомо знаем,
      // что обработчиков там не будет. Это менее критично, чем неработающие обработчики.
      // if (this._rootDOMNode.parentNode) {
      //    this.removeHandler(eventName, isBodyElement(element), false);
      // }
   }

   removeAllCaptureHandlers(): any {
      if (!this._rootDOMNode.parentNode) {
         return;
      }
      const handlers = this.__captureEventHandlers;
      for (const key in handlers) {
         if (handlers.hasOwnProperty(key)) {
            for (let i = 0; i < handlers[key].length; i++) {
               if (handlers[key][i].bodyEvent) {
                  this.removeNativeListener(window, handlers[key][i].handler, key, true);
               } else {
                  this.removeNativeListener(this._rootDOMNode.parentNode, handlers[key][i].handler, key, true);
               }
            }
         }
      }
   }

   removeProcessiingEventHandler(eventName: string): any {
      if (this._rootDOMNode.parentNode) {
         this.removeHandler(eventName, false, true);
      }
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

// Возвращает самое старое (т. к. они расположены по порядку) касание, для которого
// сработал touchStart, но для которого не было touchMove или click
function getClickStateIndexForTarget(target: HTMLElement): number {
   return clickStateTarget.findIndex((el: any): boolean => el.target === target);
}

function fixSvgElement(element: Element): any {
   // @ts-ignore FIXME: Property 'ownerSVGElement' does not exist on type Element
   return element.ownerSVGElement ? element.ownerSVGElement : element;
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

function isArgsLengthEqual(controlNodesArgs: any, evArgs: any): any {
   return controlNodesArgs && controlNodesArgs.args && controlNodesArgs.args.length === evArgs.length;
}

function checkControlNodeEvents(controlNode: any, eventName: any, index: any): any {
   return controlNode && controlNode.events && controlNode.events[eventName] && controlNode.events[eventName][index];
}

/**
 * Распространение происходит по DOM-нодам вверх по родителям, с использованием массива обработчиков eventProperties,
 * в котором указаны обработчики для каждого контрола, если эти контролы подписаны на событие
 * Таким образом, обходим всю иерархию, даже если на дом-ноде висит несколько контрол-нод.
 * @param eventObject - Объект распространения
 * @param controlNode - Контрол-нода, с элемента которой начинается распространение, если это кастомное событие
 * @param eventPropertiesStartArray - массив обработчиков в массиве eventProperties у eventObject.target,
 * с которого нужно начать цепочку вызовов обработчиков события. Необходимо для того, чтобы не вызывать обработчики
 * контролов дочерних контрол-нод.
 * @param args - Аргументы, переданные в _notify
 * @param native {any} - TODO: describe function parameter
 */
function vdomEventBubbling(
   eventObject: any,
   controlNode: any,
   eventPropertiesStartArray: any,
   args: any,
   native: any
): any {
   let eventProperties;
   let stopPropagation = false;
   const eventPropertyName = 'on:' + eventObject.type.toLowerCase();
   let curDomNode;
   let fn;
   let evArgs;
   let templateArgs;
   let finalArgs = [];

   // Если событием стрельнул window или document, то распространение начинаем с body
   if (native) {
      curDomNode =
         eventObject.target === window || eventObject.target === document ? document.body : eventObject.target;
   } else {
      curDomNode = controlNode.element;
   }
   curDomNode = native ? curDomNode : controlNode.element;

   // Цикл, в котором поднимаемся по DOM-нодам
   while (!stopPropagation) {
      eventProperties = curDomNode.eventProperties;
      if (eventProperties && eventProperties[eventPropertyName]) {
         // Вызываем обработчики для всех controlNode на этой DOM-ноде
         const eventProperty = eventPropertiesStartArray || eventProperties[eventPropertyName];
         for (let i = 0; i < eventProperty.length && !stopPropagation; i++) {
            fn = eventProperty[i].fn;
            evArgs = eventProperty[i].args || [];
            // If controlNode has event properties on it, we have to update args, because of the clos
            // happens in template function
            templateArgs = isArgsLengthEqual(checkControlNodeEvents(controlNode, eventPropertyName, i), evArgs)
               ? controlNode.events[eventPropertyName][i].args : evArgs;
            try {
               if (!args.concat) {
                  throw new Error(
                     'Аргументы обработчика события ' + eventPropertyName.slice(3) + ' должны быть массивом.'
                  );
               }
               /* Составляем массив аргументов для обаботчика. Первым аргументом будет объект события. Затем будут
                * аргументы, переданные в обработчик в шаблоне, и последними - аргументы в _notify */
               finalArgs = [eventObject];
               Array.prototype.push.apply(finalArgs, templateArgs);
               Array.prototype.push.apply(finalArgs, args);
               // Добавляем в eventObject поле со ссылкой DOM-элемент, чей обработчик вызываем
               eventObject.currentTarget = curDomNode;

               /* Контрол может быть уничтожен, пока его дочернии элементы нотифаят асинхронные события,
                  в таком случае не реагируем на события */
               /* Также игнорируем обработчики контрола, который выпустил событие.
                * То есть, сам на себя мы не должны реагировать
                * */
               if (!fn.control._destroyed && (!controlNode || fn.control !== controlNode.control)) {
                  try {
                     // TODO: убрать проверку на тип события - сделать более универсальный метод возможно надо смотреть
                     //  на eventObject.nativeEvent или вообще для всех?
                     if (!fn.control._mounted && eventObject.type === 'mouseenter') {
                        /* Асинхронный _afterMount контролов приводит к тому,
                         * что события с dom начинают стрелять до маунта,
                         * в таком случае их надо вызвать отложено */
                        callAfterMount.push({fn, finalArgs});
                     } else {
                        fn.apply(fn.control, finalArgs); // Вызываем функцию из eventProperties
                     }
                  } catch (err) {
                     // в шаблоне могут указать неверное имя обработчика, следует выводить адекватную ошибку
                     Logger.error(`Ошибка при вызове обработчика "${ eventPropertyName }" из контрола ${ fn.control._moduleName }.
                     ${ err.message }`, fn.control);
                  }
               }
               /* для событий click отменяем стандартное поведение, если контрол уже задестроен.
                * актуально для ссылок, когда основное действие делать в mousedown, а он
                * срабатывает быстрее click'а. Поэтому контрол может быть уже задестроен
                */
               if (fn.control._destroyed && eventObject.type === 'click') {
                  eventObject.preventDefault();
               }
               /* Проверяем, нужно ли дальше распространять событие по controlNodes */
               if (!eventObject.propagating()) {
                  const needCallNext =
                     !eventObject.isStopped() &&
                     eventProperty[i + 1] &&
                     // при деактивации контролов надо учитывать что событие может распространятся с partial
                     // если не далать такую проверку то подписка on:deactivated на родителе partial не будет работать
                     ((eventObject.type === 'deactivated' && eventProperty[i].toPartial) ||
                        eventProperty[i + 1].toPartial ||
                        eventProperty[i + 1].fn.controlDestination === eventProperty[i].fn.controlDestination);
                  /* Если подписались на события из HOC'a, и одновременно подписались на контент хока, то прекращать
                   распространение не нужно.
                    Пример sync-tests/vdomEvents/hocContent/hocContent */
                  if (!needCallNext) {
                     stopPropagation = true;
                  }
               }
            } catch (errorInfo) {
               let msg = `Event handle: "${eventObject.type}"`;
               let errorPoint;

               if (!fn.control) {
                  if (typeof window !== 'undefined') {
                     errorPoint = fn;
                     msg += '; Error calculating the logical parent for the function';
                  } else {
                     errorPoint = curDomNode;
                  }
               } else {
                  errorPoint = fn.control;
               }

               Logger.error(msg, errorPoint, errorInfo);
            }
         }
      }
      // TODO Remove when compatible is removed
      if (curDomNode.compatibleNotifier && controlNode && controlNode.element !== curDomNode) {
         const res = curDomNode.compatibleNotifier.notifyVdomEvent(
            eventObject.type,
            args,
            controlNode && controlNode.control
         );
         if (!eventObject.hasOwnProperty('result')) {
            eventObject.result = res;
         }
      }
      curDomNode = curDomNode.parentNode;
      if (curDomNode === null || curDomNode === undefined || !eventObject.propagating()) {
         stopPropagation = true;
      }
      if (eventPropertiesStartArray !== undefined) {
         eventPropertiesStartArray = undefined;
      }
   }
}

/**
 * Находит массив обработчиков в массиве eventProperties у controlNode.element, которые будут вызваны
 * @param controlNode
 * @returns {number}
 */
function getEventPropertiesStartArray(controlNode: any, eventName: any): any {
   const eventProperties = controlNode.element.eventProperties;
   const controlNodes = controlNode.element.controlNodes;
   const eventPropertyName = 'on:' + eventName;
   const result = [];

   if (eventProperties && eventProperties[eventPropertyName]) {
      const eventProperty = eventProperties[eventPropertyName];

      // найдем индекс controlNode распространяющего событие
      const startControlNodeIndex = controlNodes.findIndex(
         (cn: any): any => cn.control === controlNode.control
      );

      const foundHandlers = eventProperty.map((eventHandler: any): any => {
         const foundIndex = controlNodes.findIndex(
            (controlNode: any): any => controlNode.control === eventHandler.fn.control
         );
         return {
            index: foundIndex,
            eventHandler
         };
      });

      foundHandlers.forEach((handler: any): void => {
         if (handler.index === -1 || handler.index > startControlNodeIndex) {
            result.push(handler.eventHandler);
         }
      });
   }
   return result;
}

function needStopChangeEventForEdge(node: any): any {
   return node.type === 'text' || node.type === 'password';
}

function needPropagateEvent(environment: any, event: any): any {
   if (!environment._rootDOMNode) {
      return false;
   } else if (
      !(
         (event.currentTarget === window && event.type === 'scroll') ||
         (event.currentTarget === window && event.type === 'resize')
      ) &&
      event.eventPhase !== 1
   ) {
      // У событий scroll и resize нет capture-фазы,
      // поэтому учитываем их в условии проверки на фазу распространения события
      return false;
   } else if (
      detection.isIE &&
      event.type === 'change' &&
      !event._dispatchedForIE &&
      needStopChangeEventForEdge(event.target)
   ) {
      // Из-за особенностей работы vdom в edge событие change у некоторых типов input'ов стреляет не всегда.
      // Поэтому для этих типов мы будем стрелять событием сами.
      // И чтобы обработчики событий не были вызваны два раза, стопаем нативное событие.
      return false;
   } else if (!isMyDOMEnvironment(environment, event)) {
      return false;
   }

   return true;
}

/*
 * Checks if event.target is a child of current DOMEnvironment
 * @param env
 * @param event
 */
function isMyDOMEnvironment(env: any, event: any): any {
   let element = event.target;
   if (element === window || element === document) {
      return true;
   }
   const isCompatibleTemplate = requirejs.defined('OnlineSbisRu/CompatibleTemplate');
   while (element) {
      // для страниц с CompatibleTemplate вся обработка в checkSameEnvironment
      if (element === env._rootDOMNode && !isCompatibleTemplate) {
         return true;
      }
      // встретили controlNode - нужно принять решение
      if (element.controlNodes && element.controlNodes[0]) {
         return checkSameEnvironment(env, element, isCompatibleTemplate);
      }
      if (element === document.body) {
         element = document.documentElement;
      } else if (element === document.documentElement) {
         element = document;
      } else {
         element = element.parentNode;
      }
   }
   return false;
}

function checkSameEnvironment(env: any, element: any, isCompatibleTemplate: boolean): boolean {
   // todo костыльное решение, в случае CompatibleTemplate нужно всегда работать с верхним окружением (которое на html)
   // на ws3 страницах, переведенных на wasaby-окружение при быстром открытие/закртые окон не успевается полностью
   // задестроится окружение (очищается пурификатором через 10 сек), поэтому следует проверить env на destroy
   if (isCompatibleTemplate && !env._destroyed) {
      const htmlEnv = env._rootDOMNode.tagName.toLowerCase() === 'html';
      if (element.controlNodes[0].environment === env && !htmlEnv) {
         // FIXME: 1. проблема в том, что обработчики событий могут быть только на внутреннем окружении,
         // в таком случае мы должны вызвать его с внутреннего окружения.
         // FIXME: 2. обработчик может быть на двух окружениях, будем определять где он есть и стрелять
         // с внутреннего окружения, если обработчика нет на внешнем
         let hasHandlerOnEnv = false;
         let eventIndex;
         // проверяем обработчики на внутреннем окружении
         // если processingHandler === false, значит подписка была через on:event
         let currentCaptureEvent = env.__captureEventHandlers[event.type];
         for (eventIndex = 0; eventIndex < currentCaptureEvent.length; eventIndex++) {
            // нашли подписку через on:, пометим, что что на внутреннем окружении есть подходящий обработчик
            if (!currentCaptureEvent[eventIndex].processingHandler) {
               hasHandlerOnEnv = true;
            }
         }
         // Если обработчика на внутреннем окружении то ничего дальше не делаем
         if (!hasHandlerOnEnv) {
            return hasHandlerOnEnv;
         }
         // Следует определить есть ли обработчики на внешнем окружении
         let _element = element;
         while (_element !== document.body) {
            _element = _element.parentNode;
            // проверяем на наличие controlNodes на dom-элементе
            if (_element.controlNodes && _element.controlNodes[0]) {
               // нашли самое верхнее окружение
               if (_element.controlNodes[0].environment._rootDOMNode.tagName.toLowerCase() === 'html') {
                  // проверяем, что такой обработчик есть
                  if (typeof _element.controlNodes[0].environment.__captureEventHandlers[event.type] !== 'undefined') {
                     // обработчик есть на двух окружениях. Следует проанализировать обработчики на обоих окружениях
                     currentCaptureEvent = _element.controlNodes[0].environment.__captureEventHandlers[event.type];
                     let hasHandlerOnTopEnv = false;
                     // проверяем обработчики на внешнем окружении
                     for (eventIndex = 0; eventIndex < currentCaptureEvent.length; eventIndex++) {
                        // нашли подписку через on:, пометим, что что на внешнем окружении есть подходящий обработчик
                        if (!currentCaptureEvent[eventIndex].processingHandler) {
                           hasHandlerOnTopEnv = true;
                        }
                     }
                     // если обработчик есть на двух окружениях, то ничего не делаем
                     return !hasHandlerOnTopEnv && hasHandlerOnEnv;
                  }
                  return hasHandlerOnEnv;
               }
            }
         }
      }
      return htmlEnv;
   }
   return element.controlNodes[0].environment === env;
}

/**
 * It's an entry point for propagating DOM-events
 * @param event - объект события
 */
function captureEventHandler(event: any): any {
   if (needPropagateEvent(this, event)) {
      const synthEvent = new SyntheticEvent(event);

      if (detection.isMobileIOS && detection.safari && event.type === 'click' && this.touchendTarget) {
         synthEvent.target = this.touchendTarget;
         this.touchendTarget = null;
      }

      vdomEventBubbling(synthEvent, null, undefined, [], true);
   }
}

/**
 * Определяем кейс, в котором нужно подписаться именно на window.
 * @param {HTMLElement} element - элемент, у которого мы хотим обработать событие
 * @returns {boolean}
 */
function isBodyElement(element: HTMLElement): boolean {
   return element && element.tagName === 'BODY';
}

/**
 * Определяем случаи, в которых нужно явно выставлять параметр passive: false в конфиге нативного обработчика события
 * @param {string} eventName - имя события, которое хотим обработать
 * @param config - конфиг, в который добавится поле passive, если нужно.
 * @returns {any}
 */
function fixPassiveEventConfig(eventName: string, config: any): any {
   if (EventUtils.checkPassiveFalseEvents(eventName)) {
      config.passive = false;
   }
   return config;
}

// Edge (IE12) иногда стреляет selectstart при клике на элемент с user-select: none, и начинает
// выделяться весь текст на странице. Причину найти не удалось, сценарий описан в ошибке:
// https://online.sbis.ru/opendoc.html?guid=bc6d9da2-ea28-4b5d-80e1-276c3d4a0cc7
//
// Другие браузеры (Chrome) при клике на элементы с user-select: none такое событие не стреляют.
// В Edge подписываемся на selectstart на фазе захвата, и если target'ом является элемент с
// user-select: none, отменяем начало выделения через preventDefault
if (detection.isIE12 && typeof window !== 'undefined' && typeof document !== 'undefined') {
   // Проверяем _patchedSelectStart, так как этот обработчик уже могли повесить из core-init
   // (если на странице одновременно и старые и новые компоненты)
   if (!((window as any)._patchedSelectStart)) {
      (window as any)._patchedSelectStart = true;
      document.body.addEventListener('selectstart', (e) => {
         const styles = getComputedStyle(e.target as Element);
         const userSelect =
            styles.getPropertyValue('-ms-user-select') ||
            styles.getPropertyValue('user-select');
         if (userSelect === 'none') {
            e.preventDefault();
         }
      }, true);
   }
}
