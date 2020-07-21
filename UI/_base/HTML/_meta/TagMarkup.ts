/// <amd-module name="UI/_base/HTML/_meta/TagMarkup" />

import { ITagDescription, JML } from 'UI/_base/HTML/_meta/interface';

export const DEFAULT_ATTRS = {
   'data-vdomignore': 'true'
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
   return `<${tagName} ${
      Object
         .entries(_atts)
         .map(([key, val]) => `"${key}"="${val}"`)
         .join(' ')
      }>${children ? `${generateTagMarkup(children)}</${tagName}>` : ''}`;
}
/**
 * Конвертация из JsonML в ITagDescription
 * https://wi.sbis.ru/doc/platform/developmentapl/service-development/service-contract/logic/json-markup-language/
 * @param param0 
 */
export function fromJML([tagName, attrs, children]: JML): ITagDescription {
   if (!attrs || attrs.constructor !== Object) {
      // Прелесть JsonML в том, что attrs может не быть, а вторым аргументом будут children
      return fromFullJML([tagName, {}, attrs as JML]);
   }
   return fromFullJML([tagName, attrs, children]);
}
/** JsonML с аттрибутами */
function fromFullJML([tagName, attrs, children]: JML): ITagDescription {
   if (!children) {
      return { tagName, attrs } as ITagDescription;
   }
   return { tagName, attrs, children: fromJML(children) } as ITagDescription;
}