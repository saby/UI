/// <amd-module name="UI/_base/HTML/_meta/Stack" />

import {
   IMeta, IMetaState, IMetaStackInternal,
   ISerializedMetaStack, ISerializedMetaState, IMetaStateInternal
} from 'UI/_base/HTML/_meta/interface';
import { mountState, unmountState } from 'UI/_base/HTML/_meta/DOMmanipulator';
import State from 'UI/_base/HTML/_meta/State';
import { createStatesStore, IStates } from 'UI/_base/HTML/_meta/Store';
import { IStore } from 'Application/Interface';

/**
 * Хранилище meta-данных страницы
 * @class UI/_base/HTML/_meta/Stack
 * @public
 * @author Ибрагимов А.А.
 * @implements UI/_base/HTML/_meta/interface#IMetaStack
 */
export default class Stack implements IMetaStackInternal {
   private _lastState: IMetaStateInternal;

   get lastState(): IMetaStateInternal {
      return this._lastState;
   }

   set lastState(state: IMetaStateInternal) {
      mountState(state);
      unmountState(this._lastState);
      this._lastState = state;
   }

   constructor(private store: IStore<IStates>, lastState?: IMetaStateInternal) {
      if (lastState) {
         this._lastState = lastState;
      }
   }

   //#region API
   push(meta: IMeta): IMetaState {
      const state = new State(meta);
      this.linkState(state);
      this.storeState(state);
      this.lastState = state;
      return state;
   }

   remove(externalState: IMetaState): void {
      const state = this.getStateById(externalState.getId());
      if (!state) { return; }
      this.unlinkState(state);
      this.removeState(state);
   }
   //#endregion

   serialize(): string {
      const ser = this.store.getKeys()
         .map((id) => this.getStateById(id).serialize());
      return JSON.stringify(ser);
   }

   private linkState(state: IMetaStateInternal): void {
      state.setPrevState(this.lastState);
      if (!this.lastState) {
         this.lastState = state;
         return;
      }
      this.lastState.setNextState(state);
   }
   private unlinkState(state: IMetaStateInternal): void {
      const prev = this.getStateById(state.getPrevStateId());
      const next = this.getStateById(state.getNextStateId());
      if (!prev && !next) { throw new Error('Удаление последнего state!'); }
      // у начального state нет предыдущего state
      prev?.setNextState(next);
      if (!next) { // если удаляется крайний state
         this.lastState = prev;
         return;
      }
      next.setPrevState(prev);
   }
   private getStateById(id: string): IMetaStateInternal | null {
      return this.store.get(id) || null;
   }
   private removeState(state: IMetaStateInternal): void {
      this.store.remove(state.getId());
   }
   private storeState(state: IMetaStateInternal): void {
      this.store.set(state.getId(), state);
   }

   private static instance: Stack;
   static getInstance(): Stack {
      if (Stack.instance) { return Stack.instance; }
      return Stack.instance = new Stack(createStatesStore());
   }

   /**
    * Десериализация stack'a
    * @param {ISerializedMetaStack} str сериализованный стек
    * @returns {IMetaStack}
    * @private
    */
   static deserialize(str: ISerializedMetaStack): IMetaStackInternal {
      if (!str) { return null; }
      const states: IStates = {};
      try {
         const statesArr = (JSON.parse(str) as ISerializedMetaState[])
            .map((stateSer) => State.deserialize(stateSer))
            .filter((state) => state !== null);
         statesArr.forEach((state) => { states[state.getId()] = state; });
         return Stack.instance = new Stack(createStatesStore(states), statesArr[statesArr.length - 1]);
      } catch {
         return null;
      }
   }
}
