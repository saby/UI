/// <amd-module name="UI/_builder/Tmpl/core/i18n" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/i18n.ts
 */

/**
 * Empty string constant.
 */
const EMPTY_STRING = '';

/**
 * Html entity pattern.
 */
const HTML_ENTITY_PATTERN = /^&[^\s;]+;$/;

/**
 * Check if text can be translatable.
 * @todo Release clever translate wrapper.
 * @param text {string} Text data.
 * @returns {boolean} Returns true if text can be translated.
 */
export function canBeTranslated(text: string): boolean {
   // Text is considered possible to translate if it is not:
   // 1. A variable: {{ someOption }}, Text with {{ option }}s - can't be translated
   // 2. A single html entity: &amp;, &#123 - shouldn't be translated
   //    (Text with html entities can be translated: String &amp; entity)
   // 3. An INCLUDE instruction: %{INCLUDE ...} - for compatibility

   return !HTML_ENTITY_PATTERN.test(text.trim()) &&
      text.indexOf('%{INCLUDE') === -1 && text.trim().length > 0;
}

/**
 * Split translation text into text and context.
 * @param text {text} Translation text.
 * @throws {Error} Throws error if translation text contains more than 1 @@-separators.
 */
export function splitLocalizationText(text: string): { text: string, context: string } {
   const pair = text.split('@@');
   if (pair.length > 2) {
      throw new Error(`обнаружено более одного @@-разделителя в конструкции локализации`);
   }
   return {
      text: (pair.pop() || EMPTY_STRING).trim(),
      context: (pair.pop() || EMPTY_STRING).trim()
   };
}

/**
 * Interface for translation key.
 */
export interface ITranslationKey {

   /**
    * Template file where translation item was discovered.
    */
   module: string;

   /**
    * Translation key.
    */
   key: string;

   /**
    * Translation context.
    */
   context: string;
}

/**
 * Represents dictionary of translation keys.
 */
export class Dictionary {

   /**
    * Collection of translation keys.
    */
   private readonly items: ITranslationKey[];

   /**
    * Initialize new instance of translation keys dictionary.
    */
   constructor() {
      this.items = [];
   }

   /**
    * Push new data into dictionary.
    * @param module {string} Template file where translation item was discovered.
    * @param key {string} Translation text.
    * @param context {string} Translation context.
    */
   push(module: string, key: string, context: string = EMPTY_STRING): void {
      if (key.trim().length === 0) {
         return;
      }
      this.items.push({
         module,
         key,
         context
      });
   }

   /**
    * Get collection of translation keys.
    */
   getKeys(): ITranslationKey[] {
      return this.items;
   }
}

/**
 * @todo
 */
export interface INodeDescription {

   /**
    * @todo
    * @param name {string}
    */
   isAttributeTranslatable(name: string): boolean;

   /**
    * @todo
    * @param name {string}
    */
   isOptionTranslatable(name: string): boolean;
}

/**
 * @todo
 */
export interface ITextTranslator {

   /**
    * @todo
    * @param name {string}
    */
   isElementContentTranslatable(name: string): boolean;

   /**
    * @todo
    * @param name {string}
    */
   getElementDescription(name: string): INodeDescription;

   /**
    * @todo
    * @param name {string}
    */
   getComponentDescription(name: string): INodeDescription;
}

/**
 * Collection of html element names which content do not translate.
 */
const FORBIDDEN_CONTENT_TRANSLATION = [
   'style',
   'script'
];

/**
 * @todo
 */
class ElementDescription implements INodeDescription {

   /**
    * @todo
    */
   private readonly translatableAttributeNames: string[];

   /**
    * @todo
    * @param translatableAttributeNames {string[]}
    */
   constructor(translatableAttributeNames: string[]) {
      this.translatableAttributeNames = translatableAttributeNames;
   }

   /**
    * @todo
    * @param name {string}
    */
   isAttributeTranslatable(name: string): boolean {
      return this.translatableAttributeNames.indexOf(name) > -1;
   }

   /**
    * @todo
    * @param name {string}
    */
   isOptionTranslatable(name: string): boolean {
      return false;
   }
}

/**
 * @todo
 */
const ELEMENT_DESCRIPTION = new ElementDescription([
   'title'
]);

/**
 * @todo
 */
class TextTranslator implements ITextTranslator {

   /**
    * @todo
    */
   constructor() {
      // TODO: !!!
   }

   /**
    * @todo
    * @param name {string}
    */
   isElementContentTranslatable(name: string): boolean {
      return FORBIDDEN_CONTENT_TRANSLATION.indexOf(name) == -1;
   }

   /**
    * @todo
    * @param name {string}
    */
   getElementDescription(name: string): INodeDescription {
      return ELEMENT_DESCRIPTION;
   }

   /**
    * @todo
    * @param name {string}
    */
   getComponentDescription(name: string): INodeDescription {
      // TODO: For components from storage!
      return ELEMENT_DESCRIPTION;
   }
}

/**
 * @todo
 */
export function createTextTranslator(): ITextTranslator {
   return new TextTranslator();
}
