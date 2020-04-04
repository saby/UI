/// <amd-module name="UI/_base/HTML/_meta/State" />

import { IMetaState, IMeta, IDeserializeMeta } from 'UI/_base/HTML/_meta/interface';
import { Guid } from 'Types/entity';

export default class State implements IMetaState {
   constructor(
      private _meta: IMeta,
      private readonly _guid: string = Guid.create(),
      private _nextStateId: string = void 0,
      private _prevStateId: string = void 0
   ) { }

   equal(state: IMetaState): boolean {
      return state.getId() === this._guid;
   }

   getId(): string {
      return this._guid;
   }

   serialize(): string {
      const { _meta, _guid, _nextStateId, _prevStateId } = this;
      return JSON.stringify({ _meta, _guid, _nextStateId, _prevStateId });
   }

   getNextStateId(): string {
      return this._nextStateId;
   }

   setNextState(state: IMetaState | null): void {
      this._nextStateId = state?.getId();
   }

   getPrevStateId(): string {
      return this._prevStateId;
   }

   setPrevState(state: IMetaState | null): void {
      this._prevStateId = state?.getId();
   }
}

export const deserializeState: IDeserializeMeta = (str) => {
   const { _meta, _guid, _nextStateId, _prevStateId } = JSON.parse(str);
   return new State(_meta, _guid, _nextStateId, _prevStateId);
};
