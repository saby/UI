/// <amd-module name="UI/_base/HTML/_meta/Store" />

import { getStore, setStore } from 'Application/Env';
import { isInit } from 'Application/Initializer';
import { IStore } from 'Application/Interface';
import { IMetaStateInternal } from 'UI/_base/HTML/_meta/interface';
import { constants } from 'Env/Env';

export type IStates = Record<string, IMetaStateInternal>;

class StateStore implements IStore<IStates> {
   constructor(
      private data: IStates = Object.create(null)
   ) { }
   get<K extends keyof IStates>(id: K): IStates[K] {
      return this.data[id];
   }
   set<K extends keyof IStates>(id: K, state: IStates[K]): boolean {
      this.data[id] = state;
      return true;
   }
   remove(id: keyof IStates): void {
      delete this.data[id];
   }
   getKeys(): Array<keyof IStates & string> {
      return Object.keys(this.data) as Array<keyof IStates & string>;
   }
   toObject(): { [key in keyof IStates]: IStates[key] } {
      return this.data;
   }

   static label: string = 'UI/_base/HTML/_meta/Stack#MetaStore';
}

export function createStatesStore(states?: IStates): () => IStore<IStates> {
   if (constants.isBrowserPlatform || !isInit()) {
      /**
       * Для случаев, когда приложение не инициализированно (unit-тесты)
       * используется локальный Store
       */
      const store: IStore<IStates> = new StateStore(states);
      return () => store;
   }
   const createDefaultStore = (s?: IStates): StateStore => new StateStore(s);
   setStore<IStates>(StateStore.label, createDefaultStore(states));
   return () => getStore<IStates>(StateStore.label, createDefaultStore);
}
