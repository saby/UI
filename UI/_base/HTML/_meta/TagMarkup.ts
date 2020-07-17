/// <amd-module name="UI/_base/HTML/_meta/TagMarkup" />

import { ITagDescription } from 'UI/_base/HTML/_meta/interface';

export const DEFAULT_ATTRS = {
   'data-vdomignore': 'true'
};

export default class {
   outerHTML: string = '';

   constructor(tags: ITagDescription[]) {
      this.outerHTML = tags
         .map(generateTagMarkup)
         .join('\n');
   }
}


export function generateTagMarkup({ tagName, attrs }: ITagDescription = { tagName: 'no_tag', attrs: {} }) {
   const _atts = { ...DEFAULT_ATTRS, ...attrs };
   return `<${tagName} ${
      Object
         .entries(_atts)
         .map(([key, val]) => `"${key}"="${val}"`)
         .join(' ')
      }>`;
}