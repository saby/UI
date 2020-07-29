/// <amd-module name="UI/_base/HTML/_meta/TagMarkup" />

import { ITagDescription } from 'UI/_base/HTML/_meta/interface';

export const DEFAULT_ATTRS = {
   'data-vdomignore': 'true'
};

// https://www.w3.org/TR/2011/WD-html-markup-20110113/syntax.html#void-element
const HTML_VOID_ELEMENTS = {
   'area': true, 'base': true, 'br': true, 'col': true,
   'command': true, 'embed': true, 'hr': true, 'img': true,
   'input': true, 'keygen': true, 'link': true, 'meta': true,
   'param': true, 'source': true, 'track': true, 'wbr': true
};

export default class {
   outerHTML: string = '';

   constructor (tags: ITagDescription[]) {
      this.outerHTML = tags
         .map(generateTagMarkup)
         .join('\n');
   }
}

export function generateTagMarkup({ tagName, attrs, children }: ITagDescription = { tagName: 'no_tag', attrs: {} }) {
   const _atts = { ...DEFAULT_ATTRS, ...attrs };
   const attrMarkup = Object.entries(_atts).map(([key, val]) => `${key}="${val}"`).join(' ');
   if (!children) {
      const endChar = HTML_VOID_ELEMENTS[tagName] ? '' : '/';
      return `<${tagName} ${attrMarkup}${endChar}>`;
   }
   const childMarkup = (typeof children === 'string') ? children : generateTagMarkup(children);
   return `<${tagName} ${attrMarkup}> ${childMarkup} </${tagName}>`;
}
