/// <amd-module name="UI/_base/HTML/_meta/DOMmanipulator" />
import { IMetaState, IMetaStateInternal } from 'UI/_base/HTML/_meta/interface';

export function mountState(state: IMetaStateInternal): void {
   if (typeof document === 'undefined') { return; }
   const setAttrs = (el: HTMLElement) => setGuid(el, state.getId());
   const { title, og } = state.getMeta();
   Object.keys(og || [])
      .map((tag) => createOpenGraphTag(tag, og[tag]))
      .concat([createTitleElement(title)])
      .map(setAttrs)
      .forEach((el) => document.head.prepend(el));
}

export function unmountState(state?: IMetaState): void {
   if (typeof document === 'undefined' || typeof state === 'undefined') { return; }
   const elements = document.querySelectorAll(`.${state.getId()}`);
   Array.prototype.forEach.call(elements, (el: HTMLElement) => { el.remove(); });
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
