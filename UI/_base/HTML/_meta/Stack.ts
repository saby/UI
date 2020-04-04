/// <amd-module name="UI/_base/HTML/_meta/Stack" />

import { IMetaState, IMeta, ISerializableMetaStack, ISerializedMetaState, IDeserializeStack } from 'UI/_base/HTML/_meta/interface';
import State, { deserializeState } from 'UI/_base/HTML/_meta/State';

export default class Stack implements ISerializableMetaStack {

   constructor(
      private states: Record<string, IMetaState> = {},
      private lastState: IMetaState | null = null
   ) { }

   push(meta: IMeta): IMetaState {
      const state = new State(meta);
      this.linkState(state);
      this.states[state.getId()] = state;
      this.lastState = state;
      return state;
   }

   remove(exState: IMetaState): void {
      if (!(exState.getId() in this.states)) { return; }
      const state = this.states[exState.getId()];
      this.unlinkState(state);
      delete this.states[state.getId()];
   }

   last(): IMetaState | null {
      return this.lastState;
   }

   serialize(): string {
      const ser = this.getStates().map((state) => state.serialize());
      return JSON.stringify(ser);
   }

   private linkState(state: IMetaState): void {
      state.setPrevState(this.lastState);
      if (!this.lastState) {
         this.lastState = state;
         return;
      }
      this.lastState.setNextState(state);
   }

   private unlinkState(state: IMetaState): void {
      const prev = this.getState(state.getPrevStateId());
      const next = this.getState(state.getNextStateId());
      prev?.setNextState(next); // предыдущего state нет у начального state
      if (!next) { // если удаляется крайний state
         this.lastState = prev;
         return;
      }
      next.setPrevState(prev);
   }

   private getState(id: string): IMetaState | null {
      return this.states[id] || null;
   }

   private getStates(): IMetaState[] {
      return Object.keys(this.states).map((id) => this.states[id]);
   }

   private static instance: Stack;

   static getInstance(): Stack {
      if (Stack.instance) { return Stack.instance; }
      return Stack.instance = new Stack();
   }
}
export const deserializeStack: IDeserializeStack = (str) => {
   const states: Record<string, IMetaState> = {};
   const statesArr = (JSON.parse(str) as ISerializedMetaState[]).map((stateSer) => deserializeState(stateSer));
   statesArr.forEach((state) => { states[state.getId()] = state; });
   return new Stack(states, statesArr[statesArr.length - 1]);
};
