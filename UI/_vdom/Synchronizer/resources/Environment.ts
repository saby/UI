/// <amd-module name="UI/_vdom/Synchronizer/resources/Environment" />
// tslint:disable: ban-ts-ignore

import { render } from 'Inferno/third-party/index';
import { VNode } from 'Inferno/third-party/index';
import { hydrate } from 'Inferno/third-party/hydrate';
import { IControlNode, IMemoNode, TModifyHTMLNode } from '../interfaces';
import { delay } from 'Types/function';
import { DirtyKind } from './DirtyChecking';
import MountMethodsCaller from './MountMethodsCaller';
import { Logger } from 'UI/Utils';
import { onEndSync } from 'UI/DevtoolsHook';
import { BoundaryElements } from 'UI/Focus';

interface IDires {
   [key: string]: number;
}

const mountMethodsCaller: MountMethodsCaller = new MountMethodsCaller();

/**
 * @author Кондаков Р.Н.
 * Абстракция для окружения, в котором строится виртуальное дерево
 */
abstract class Environment {
   private _rebuildIgnoreId: string | null;
   protected _destroyed: boolean;

   // FIXME: костыль для Synchronizer и DirtyChecking
   _currentDirties: IDires;
   // FIXME: костыль для Synchronizer
   _nextDirties: IDires;
   _rebuildRequestStarted: boolean = false;
   _haveRebuildRequest: boolean = false;
   private queue: string[] = null;

   constructor(public _rootDOMNode: TModifyHTMLNode, private _controlStateChangedCallback: Function) {
      // @ts-ignore
      if (_rootDOMNode === document) {
         throw new Error('Корневой контрол нельзя монтировать на document');
      }

      this._rebuildIgnoreId = null;
      this._currentDirties = {};
      this._nextDirties = {};
   }

   destroy(): void {
      this.runQueue();
      this._haveRebuildRequest = false;
      this._rootDOMNode = undefined;
      this._currentDirties = {};
      this._nextDirties = {};
      // Clean up the saved stateChanged handler so it (and its closure)
      // don't get stuck in memory
      this._controlStateChangedCallback = null;
      this._destroyed = true;
   }

   forceRebuild(id: string): void {
      if (this._rebuildIgnoreId !== id && this._controlStateChangedCallback) {
         this._controlStateChangedCallback(id);
      }
   }

   setRebuildIgnoreId(id: string): void {
      this._rebuildIgnoreId = id;
   }

   needWaitAsyncInit(): boolean {
      return false;
   }

   setupControlNode(controlNode: IControlNode): void {
      // @ts-ignore
      controlNode.environment = this;
      // @ts-ignore
      controlNode.control._saveEnvironment(this, controlNode);
   }

   getDOMNode(): HTMLElement {
      return this._rootDOMNode;
   }

   /**
    * Кейс: в панели идет перерисовка. Панель что-то сообщает опенеру
    * опенер передает данные в контрол, который лежит вне панели
    * контрол дергает _forceUpdate и попадает в очередь перерисовки панели
    * затем панель разрушается и заказанной перерисовки контрола вне панели не случается
    */
   private runQueue(): void {
      if (this.queue) {
         for (let i = 0; i < this.queue.length; i++) {
            this.forceRebuild(this.queue[i]);
         }
      }
      this.queue = null;
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
      // tslint:disable:no-bitwise
      if (this._currentDirties[newNode.id] & DirtyKind.DIRTY) {
         rebuildChanges.add(newNode.id);
      }
      const vnode: VNode = newNode.fullMarkup;
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

      let control;
      // @ts-ignore
      const isCompatible = newNode.control.hasCompatible && newNode.control.hasCompatible();
      if (isCompatible) {
         control = newNode.control;
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
            this.callEventsToDOM();

            this._rebuildRequestStarted = false;
            this.runQueue();
            onEndSync(newNode.rootId);
         });

         return;
      }

      this._haveRebuildRequest = false;

      mountMethodsCaller.componentDidUpdate(controlNodesToCall);
      mountMethodsCaller.beforePaint(controlNodesToCall);
      // используется setTimeout вместо delay, т.к. delay работает через rAF
      // rAF зовётся до того, как браузер отрисует кадр,
      //    а _afterUpdate должен вызываться после, чтобы не вызывать forced reflow.
      // Если делать то же самое через rAF, то нужно звать rAF из rAF, это и дольше, и неудобно.
      setTimeout(() => {
         mountMethodsCaller.afterUpdate(controlNodesToCall);
         this.callEventsToDOM();
         onEndSync(newNode.rootId);
         this._rebuildRequestStarted = false;
         this.runQueue();
      }, 0);
   }

   /**
    * Метод для отстреливания событий после обновления DOM-дерева
    */
   protected abstract callEventsToDOM(): void;
}

export default Environment;
