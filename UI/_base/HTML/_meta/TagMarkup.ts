/// <amd-module name="UI/_base/HTML/_meta/TagMarkup" />

import { ITagDescription } from 'UI/_base/HTML/_meta/interface';
import getResourceUrl = require('Core/helpers/getResourceUrl');
import escapeHtml = require('Core/helpers/String/escapeHtml');

/**
 * @interface ITagMarkupConfig дополнительные параметры для генератора верстки
 * @param {boolean} withOutDataVdomIgnore - НЕ подмешивать атрибут data-vdomignore для тегов
 */
interface ITagMarkupConfig {
   withOutDataVdomIgnore?: boolean;
}

export const DEFAULT_ATTRS = {
   'data-vdomignore': 'true'
};

// https://www.w3.org/TR/2011/WD-html-markup-20110113/syntax.html#void-element
const HTML_VOID_ELEMENTS = {
   area: true, base: true, br: true, col: true,
   command: true, embed: true, hr: true, img: true,
   input: true, keygen: true, link: true, meta: true,
   param: true, source: true, track: true, wbr: true
};

export default class {
   outerHTML: string = '';

   constructor(tags: ITagDescription[], config?: ITagMarkupConfig) {
      this.outerHTML = tags
          .map((tag: ITagDescription) => generateTagMarkup(tag, config))
          .join('\n');
   }
}

export function generateTagMarkup(
    { tagName, attrs, children }: ITagDescription = { tagName: 'no_tag', attrs: {} },
    config?: ITagMarkupConfig): string {
   const _atts = { ...DEFAULT_ATTRS, ...attrs };
   if (config?.withOutDataVdomIgnore) { delete _atts['data-vdomignore']; }

   // decorate all of input links and scripts to redirect requests onto
   // cdn domain if it's configured on current page.
   const attrMarkup = Object.entries(_atts).map(([key, val]) => {
      if (key === 'href' || key === 'src') {
         return `${key}="${getResourceUrl(val)}"`;
      }
      return `${key}="${escapeHtml(val)}"`;
   }).join(' ');
   if (HTML_VOID_ELEMENTS[tagName]) {
      return `<${tagName} ${attrMarkup}>`;
   }

   let childMarkup = '';
   if (children) {
      childMarkup = (typeof children === 'string') ? children : generateTagMarkup(children);
   }
   return `<${tagName} ${attrMarkup}>${childMarkup}</${tagName}>`;
}
