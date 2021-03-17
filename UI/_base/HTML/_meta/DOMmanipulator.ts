/// <amd-module name="UI/_base/HTML/_meta/DOMmanipulator" />
import { IMetaState, IMetaStateInternal } from 'UI/_base/HTML/_meta/interface';
import { Head as HeadAPI } from 'Application/Page';
import { IHeadTagId } from 'Application/Interface';

export function mountState(state: IMetaStateInternal): IHeadTagId[] {
   const { title, og } = state.getMeta();
   return Object.keys(og || [])
       .map((tag) => createOpenGraphTag(tag, og[tag], state.getId()))
       .concat([createTitleElement(title, state.getId())]);
}

export function unmountState(state?: IMetaState): void {
   if (typeof state === 'undefined') { return; }
   const API = HeadAPI.getInstance();
   const tags: IHeadTagId | IHeadTagId[] | null = API.getTag(null, {class: state.getId()});
   if (tags) {
      [].concat(tags).forEach((tag: IHeadTagId) => {
         API.deleteTag(tag);
      });
   }
}

function createTitleElement(val: string, guid: string): IHeadTagId {
   return HeadAPI.getInstance().createTag('title', {class: guid}, val);
}

function createOpenGraphTag(type: string, val: string, guid: string): IHeadTagId {
   return HeadAPI.getInstance().createTag('meta', {property: `og:${type}`, content: val, class: guid});
}
