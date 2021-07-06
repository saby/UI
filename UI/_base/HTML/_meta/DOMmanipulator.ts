/// <amd-module name="UI/_base/HTML/_meta/DOMmanipulator" />
import { IMetaStateInternal } from 'UI/_base/HTML/_meta/interface';
import { Head as HeadAPI } from 'Application/Page';
import type { IPageTagId } from 'Application/Page';

export function mountState(state: IMetaStateInternal): IPageTagId[] {
   const { title, og } = state.getMeta();
   return Object.keys(og || [])
       .map((tag) => createOpenGraphTag(tag, og[tag], state.getId()))
       .concat([createTitleElement(title, state.getId())]);
}

export function unmountState(headTagIds: IPageTagId[]): void {
   if (!headTagIds) { return; }
   const API = HeadAPI.getInstance();
   headTagIds.forEach((tag: IPageTagId) => {
      API.deleteTag(tag);
   });
}

function createTitleElement(val: string, guid: string): IPageTagId {
   return HeadAPI.getInstance().createTag('title', {class: guid}, val);
}

function createOpenGraphTag(type: string, val: string, guid: string): IPageTagId {
   return HeadAPI.getInstance().createTag('meta', {property: `og:${type}`, content: val, class: guid});
}
