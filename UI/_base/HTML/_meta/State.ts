/// <amd-module name="UI/_base/HTML/_meta/State" />

import { IMetaState, IMeta, ISerializedMetaState, IMetaStateInternal } from 'UI/_base/HTML/_meta/interface';
let id = 1;
const generateGuid = () => id++;
/**
 * @class UI/_base/HTML/_meta/State
 * @implements {UI/_base/HTML/_meta/IMetaState}
 * @author Ибрагимов А.А.
 */
export default class State implements IMetaStateInternal {
   outerHTML: string = '';
   constructor(
      private _meta: IMeta,
      private readonly _guid: string = 'state-' + generateGuid(),
      private _nextStateId: string = void 0,
      private _prevStateId: string = void 0
   ) {
      this.outerHTML = createMarkup(_meta, _guid);
   }

   //#region API
   getId(): string {
      return this._guid;
   }
   equal(state: IMetaState): boolean {
      return state.getId() === this._guid;
   }
   //#endregion

   serialize(): string {
      const { _meta, _guid, _nextStateId, _prevStateId } = this;
      return JSON.stringify({ _meta, _guid, _nextStateId, _prevStateId });
   }

   getMeta(): IMeta {
      return this._meta;
   }

   getNextStateId(): string {
      return this._nextStateId;
   }

   setNextState(state: IMetaStateInternal | null): void {
      this._nextStateId = state?.getId();
   }

   getPrevStateId(): string {
      return this._prevStateId;
   }

   setPrevState(state: IMetaStateInternal | null): void {
      this._prevStateId = state?.getId();
   }
   /**
    * Десериализация состояния
    * @returns {ISerializedMetaState}
    * @example
    * const state = new State(meta);
    * deserializeState(state.serialize()).equal(state)) === true;
    */
   static deserialize(str: ISerializedMetaState): IMetaStateInternal | null {
      if (!str) { return null; }
      try {
         const { _meta, _guid, _nextStateId, _prevStateId } = JSON.parse(str);
         return new State(_meta, _guid, _nextStateId, _prevStateId);
      } catch {
         return null;
      }
   }
}

function createMarkup(meta: IMeta, guid: string): string {
   const title = `<title data-vdomignore="true" class="${guid}">${meta.title}</title>`;
   const ogTagsMarkup = Object.keys(meta.og || [])
      .map((type) => getTagMargkup(type, meta.og[type], guid))
      .join('');
   return `${title}${ogTagsMarkup}`;
}

function getTagMargkup(type: string, val: string, guid: string): string {
   return `<meta property="og:${type}"` +
      ` content="${val}" class="${guid}"` +
      ' data-vdomignore="true" />';
}
