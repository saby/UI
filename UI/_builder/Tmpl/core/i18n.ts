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
 * Split translation text into text and context.
 * @param text {text} Translation text.
 * @throws {Error} Throws error if translation text contains more than 1 @@-separators.
 */
export function splitLocalizationText(text: string): { text: string, context: string } {
   const pair = text.split('@@');
   if (pair.length > 2) {
      throw new Error(`Обнаружено более одного @@-разделителя в конструкции локализации`);
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
    * Translation text.
    */
   text: string;

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
    * @param text {string} Translation text.
    * @param context {string} Translation context.
    */
   push(module: string, text: string, context: string = EMPTY_STRING): void {
      if (text.trim().length === 0) {
         return;
      }
      this.items.push({
         module,
         text,
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
