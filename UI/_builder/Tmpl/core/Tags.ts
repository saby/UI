/// <amd-module name="View/Builder/Tmpl/core/Tags" />

import getTagDescription, { TagDescription, ITagsDescription } from 'View/Builder/Tmpl/html/Tags';

/**
 * @author Крылов М.А.
 */

// tslint:disable:object-literal-key-quotes
const TAGS_DESCRIPTIONS: ITagsDescription = {
   'ws:template': new TagDescription({
      allowSelfClosing: false
   })
};
// tslint:enable:object-literal-key-quotes

/**
 *
 * @param name {string}
 */
export default function getWasabyTagDescription(name: string): TagDescription {
   if (TAGS_DESCRIPTIONS[name]) {
      return TAGS_DESCRIPTIONS[name];
   }
   return getTagDescription(name);
}
