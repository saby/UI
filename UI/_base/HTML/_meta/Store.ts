/// <amd-module name="UI/_base/HTML/_meta/Store" />

import { getStore, setStore } from 'Application/Env';
import { isInit } from 'Application/Initializer';
import { IStore } from 'Application/Interface';
import { IMetaStateInternal } from 'UI/_base/HTML/_meta/interface';

export type IStates = Record<string, IMetaStateInternal>;

class StateStore<T = IStates> implements IStore<T> {
   constructor(
      private data: T = Object.create(null)
   ) { }
   get<K extends keyof T>(id: K): T[K] {
      return this.data[id];
   }
   set<K extends keyof T>(id: K, state: T[K]): boolean {
      this.data[id] = state;
      return true;
   }
   remove(id: keyof T): void {
      delete this.data[id];
   }
   getKeys(): Array<keyof T & string> {
      return Object.keys(this.data) as Array<keyof T & string>;
   }
   toObject(): { [key in keyof T]: T[key] } {
      return this.data;
   }

   static label: string = 'UI/_base/HTML/_meta/Stack#MetaStore';
}

const createDefaultStore = (states?: IStates): StateStore => new StateStore(states);

/**
 * Для случаев, когда приложение не инициализированно (unit-тесты)
 * используется локальный Store
 */
let stateStore = new StateStore();

export function getMetaStore(): IStore<IStates> {
   if (!isInit()) {
      return stateStore;
   }
   return getStore<IStates>(StateStore.label, createDefaultStore);
}

export function setMetaStore(states: IStates): void {
   if (!isInit()) {
      stateStore = new StateStore(states);
      return;
   }
   setStore<IStates>(StateStore.label, createDefaultStore(states));
}
