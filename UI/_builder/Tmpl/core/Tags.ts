/// <amd-module name="UI/_builder/Tmpl/core/Tags" />

/**
 * @description Represents wasaby tag descriptor.
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Tags.ts
 */

import getTagDescription, { TagDescription, ITagsDescription } from 'UI/_builder/Tmpl/html/Tags';

// tslint:disable:object-literal-key-quotes

/**
 * Wasaby tag descriptions.
 */
const TAGS_DESCRIPTIONS: ITagsDescription = {
   'ws:template': new TagDescription({
      allowSelfClosing: false
   })
};

// tslint:enable:object-literal-key-quotes

/**
 * Get tag description by name.
 * @param name {string} Tag name.
 */
export default function getWasabyTagDescription(name: string): TagDescription {
   if (TAGS_DESCRIPTIONS[name]) {
      return TAGS_DESCRIPTIONS[name];
   }
   return getTagDescription(name);
}
