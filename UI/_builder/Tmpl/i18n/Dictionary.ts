/// <amd-module name="UI/_builder/Tmpl/i18n/Dictionary" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/i18n/Dictionary.ts
 */

/**
 * Empty string constant.
 */
const EMPTY_STRING = '';

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
         key,
         context,
         module
      });
   }

   /**
    * Get collection of translation keys.
    */
   getKeys(): ITranslationKey[] {
      return this.items;
   }
}
