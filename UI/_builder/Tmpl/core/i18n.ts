/// <amd-module name="UI/_builder/Tmpl/core/i18n" />

/**
 * @author Крылов М.А.
 */

const EMPTY_STRING = '';

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

export interface IDictionaryItem {
   module: string;
   text: string;
   context: string;
}

export class Dictionary {
   private readonly items: IDictionaryItem[];

   constructor() {
      this.items = [];
   }

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

   getItems(): IDictionaryItem[] {
      return this.items;
   }
}
