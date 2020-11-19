/// <amd-module name="UI/_base/HTML/_meta/TagMarkup" />

import { ITagDescription } from 'UI/_base/HTML/_meta/interface';
import getResourceUrl = require('Core/helpers/getResourceUrl');

// https://www.w3.org/TR/2011/WD-html-markup-20110113/syntax.html#void-element
const HTML_VOID_ELEMENTS = {
   'area': true, 'base': true, 'br': true, 'col': true,
   'command': true, 'embed': true, 'hr': true, 'img': true,
   'input': true, 'keygen': true, 'link': true, 'meta': true,
   'param': true, 'source': true, 'track': true, 'wbr': true
};

export default class {
   outerHTML: string = '';

   constructor(tags: ITagDescription[]) {
      this.outerHTML = tags
         .map(generateTagMarkup)
         .join('\n');
   }
}

export function generateTagMarkup(
   { tagName, attrs, children }: ITagDescription = { tagName: 'no_tag', attrs: {} }): string {

   // decorate all of input links and scripts to redirect requests onto
   // cdn domain if it's configured on current page.
   const attrMarkup = Object.entries(attrs || {}).map(([key, val]) => {
      if (key === 'href' || key === 'src') {
         return `${key}="${getResourceUrl(val)}"`;
      }
      return `${key}="${val}"`;
   }).join(' ');
   const inTagContent = [tagName, attrMarkup].join(' ').trim();
   if (HTML_VOID_ELEMENTS[tagName]) {
      return `<${inTagContent}>`;
   }

   let childMarkup = '';
   if (children) {
      childMarkup = (typeof children === 'string') ? children : generateTagMarkup(children);
   }
   return `<${inTagContent}>${childMarkup}</${tagName}>`;
}
