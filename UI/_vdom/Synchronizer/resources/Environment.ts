/// <amd-module name="UI/_vdom/Synchronizer/resources/Environment" />

import { VNode } from 'Inferno/third-party/index';
import { IControlNode } from '../interfaces';

/**
 * @author Кондаков Р.Н.
 */

class Environment {
   private _rebuildIgnoreId: string | null;
   protected _destroyed: boolean;

   constructor(private _controlStateChangedCallback: Function) {
      this._rebuildIgnoreId = null;
   }

   destroy(): void {
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

   decorateRootNode(vnode: IControlNode): VNode {
      // return this._rootMapper ? this._rootMapper(vnode) : vnode;
      // FIXME: Декорирование подразумевает трансформацию Wasaby Virtual Nodes and Inferno Virtual Nodes
      //  исключительно в Inferno Virtual Nodes. Необходимо выделить интерфейсы Wasaby Virtual Nodes,
      //  определить этапы/места, где узлы могут быть смешанными (как inferno, так и wasaby), а где только inferno,
      //  реализовать флаги-типы (aka ['VirtualNodes/Inferno'], ['VirtualNodes/Wasaby']
      //  или расширить inferno перечисление).
      // @ts-ignore
      return vnode;
   }
}

export default Environment;
