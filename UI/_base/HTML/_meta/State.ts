/// <amd-module name="UI/_base/HTML/_meta/State" />

import { IMetaState, IMeta, ISerializedMetaState, IMetaStateInternal } from 'UI/_base/HTML/_meta/interface';
// @ts-ignore
import { Guid } from 'Types/entity';

export default class State implements IMetaStateInternal {
   outerHTML: string = '';
   elements: HTMLElement[] = [];
   constructor(
      private _meta: IMeta,
      private readonly _guid: string = 'state-' + Guid.create(),
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

   mount(): void {
      if (typeof document === 'undefined') { return; }
      const setAttrs = (el: HTMLElement) => setGuid(el, this._guid);
      const { title, og } = this.getMeta();
      const titleEl = createTitleElement(title);
      const ogTags = Object.keys(og || []).map((tag) => createOpenGraphTag(tag, og[tag]));
      this.elements = ogTags.concat([titleEl]).map(setAttrs);
      this.elements.forEach((el) => document.head.prepend(el));
   }

   unmount(): void {
      if (typeof document === 'undefined') { return; }
      const elements = document.querySelectorAll(`.${this._guid}`);
      Array.prototype.forEach.call(elements, (el: HTMLElement) => { el.remove(); });
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

function createTitleElement(val: string): HTMLElement {
   const el = document.createElement('title');
   el.innerHTML = val;
   return el;
}
function createOpenGraphTag(type: string, val: string): HTMLElement {
   const el = document.createElement('meta');
   el.setAttribute('property', `og:${type}`);
   el.setAttribute('content', val);
   return el;
}
function setGuid(el: HTMLElement, guid: string): HTMLElement {
   el.setAttribute('data-vdomignore', 'true');
   el.setAttribute('class', guid);
   return el;
}
