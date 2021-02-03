/**
 * @author Крылов М.А.
 *
 * @link https://www.w3.org/TR/html51/syntax.html#optional-tags
 */

import { ContentModel } from './ContentModel';

const EMPTY_ARRAY = [];
const EMPTY_STRING = '';

/**
 *
 */
export interface ITagDescription {

   /**
    *
    */
   readonly contentModel?: ContentModel;

   /**
    *
    */
   readonly isVoid?: boolean;

   /**
    *
    */
   readonly allowSelfClosing?: boolean;

   /**
    *
    */
   readonly ignoreFirstLF?: boolean;

   /**
    *
    */
   readonly closedByParent?: boolean;

   /**
    *
    */
   readonly closedByChildren?: string[];

   /**
    *
    */
   readonly implicitNameSpace?: string | undefined;
}

/**
 *
 */
export class TagDescription implements ITagDescription {

   /**
    *
    */
   readonly contentModel: ContentModel;

   /**
    *
    */
   readonly isVoid: boolean;

   /**
    *
    */
   readonly allowSelfClosing: boolean;

   /**
    *
    */
   readonly ignoreFirstLF: boolean;

   /**
    *
    */
   readonly closedByParent: boolean;

   /**
    *
    */
   readonly closedByChildren: string[];

   /**
    *
    */
   readonly implicitNameSpace: string | undefined;

   /**
    *
    * @param tagDescription
    */
   constructor(tagDescription: ITagDescription) {
      this.contentModel = tagDescription.contentModel === undefined
         ? ContentModel.PARSABLE_DATA
         : tagDescription.contentModel;
      this.isVoid = !!tagDescription.isVoid;
      this.allowSelfClosing = !!tagDescription.allowSelfClosing;
      this.ignoreFirstLF = !!tagDescription.ignoreFirstLF;
      this.closedByParent = !!tagDescription.closedByParent;
      this.closedByChildren = tagDescription.closedByChildren || EMPTY_ARRAY;
      this.implicitNameSpace = tagDescription.implicitNameSpace || EMPTY_STRING;
   }

   /**
    *
    * @param childTagName
    */
   isClosedByChild(childTagName: string): boolean {
      return this.isVoid || this.closedByChildren.indexOf(childTagName.toLowerCase()) !== -1;
   }
}

/**
 *
 */
const DEFAULT_DESCRIPTION = new TagDescription({
   allowSelfClosing: true
});

/**
 *
 */
export interface ITagsDescription {
   [elementName: string]: TagDescription;
}

// tslint:disable:object-literal-key-quotes
const TAGS_DESCRIPTIONS: ITagsDescription = {
   'base': new TagDescription({
      isVoid: true
   }),
   'meta': new TagDescription({
      isVoid: true
   }),
   'area': new TagDescription({
      isVoid: true
   }),
   'embed': new TagDescription({
      isVoid: true
   }),
   'link': new TagDescription({
      isVoid: true
   }),
   'img': new TagDescription({
      isVoid: true
   }),
   'input': new TagDescription({
      isVoid: true
   }),
   'param': new TagDescription({
      isVoid: true
   }),
   'hr': new TagDescription({
      isVoid: true
   }),
   'br': new TagDescription({
      isVoid: true
   }),
   'source': new TagDescription({
      isVoid: true
   }),
   'track': new TagDescription({
      isVoid: true
   }),
   'wbr': new TagDescription({
      isVoid: true
   }),
   'p': new TagDescription({
      closedByChildren: [
         'address', 'article', 'aside',   'blockquote', 'div',  'dl',  'fieldset',
         'footer',  'form',    'h1',      'h2',         'h3',   'h4',  'h5',
         'h6',      'header',  'hgroup',  'hr',         'main', 'nav', 'ol',
         'p',       'pre',     'section', 'table',      'ul'
      ],
      closedByParent: true
   }),
   'thead': new TagDescription({
      closedByChildren: [
         'tbody', 'tfoot'
      ]
   }),
   'tbody': new TagDescription({
      closedByChildren: [
         'tbody', 'tfoot'
      ],
      closedByParent: true
   }),
   'tfoot': new TagDescription({
      closedByChildren: [
         'tbody'
      ],
      closedByParent: true
   }),
   'tr': new TagDescription({
      closedByChildren: [
         'tr'
      ],
      closedByParent: true
   }),
   'td': new TagDescription({
      closedByChildren: [
         'td', 'th'
      ],
      closedByParent: true
   }),
   'th': new TagDescription({
      closedByChildren: [
         'td', 'th'
      ],
      closedByParent: true
   }),
   'col': new TagDescription({
      isVoid: true
   }),
   'svg': new TagDescription({
      allowSelfClosing: true,
      implicitNameSpace: 'svg'
   }),
   'math': new TagDescription({
      implicitNameSpace: 'math'
   }),
   'li': new TagDescription({
      closedByChildren: [
         'li'
      ],
      closedByParent: true
   }),
   'dt': new TagDescription({
      closedByChildren: [
         'dt', 'dd'
      ]
   }),
   'dd': new TagDescription({
      closedByChildren: [
         'dt', 'dd'
      ],
      closedByParent: true
   }),
   'rb': new TagDescription({
      closedByChildren: [
         'rb', 'rt', 'rtc', 'rp'
      ], closedByParent: true
   }),
   'rt': new TagDescription({
      closedByChildren: [
         'rb', 'rt', 'rtc', 'rp'
      ],
      closedByParent: true
   }),
   'rtc': new TagDescription({
      closedByChildren: [
         'rb', 'rtc', 'rp'
      ],
      closedByParent: true
   }),
   'rp': new TagDescription(
      {
         closedByChildren: [
            'rb', 'rt', 'rtc', 'rp'
         ],
         closedByParent: true
      }),
   'optgroup': new TagDescription({
      closedByChildren: [
         'optgroup'
      ],
      closedByParent: true
   }),
   'option':
      new TagDescription({
         closedByChildren: [
            'option', 'optgroup'
         ],
         closedByParent: true
      }),
   'pre': new TagDescription({
      ignoreFirstLF: true
   }),
   'listing': new TagDescription({
      ignoreFirstLF: true
   }),
   'style': new TagDescription({
      contentModel: ContentModel.RAW_TEXT
   }),
   'script': new TagDescription({
      contentModel: ContentModel.RAW_TEXT
   }),
   'title': new TagDescription({
      contentModel: ContentModel.ESCAPABLE_RAW_TEXT
   }),
   'textarea': new TagDescription({
      contentModel: ContentModel.ESCAPABLE_RAW_TEXT,
      ignoreFirstLF: true
   })
};
// tslint:enable:object-literal-key-quotes

/**
 *
 * @param name
 */
export default function getTagDescription(name: string): TagDescription {
   if (TAGS_DESCRIPTIONS[name]) {
      return TAGS_DESCRIPTIONS[name];
   }
   return DEFAULT_DESCRIPTION;
}
