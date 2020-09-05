/// <amd-module name="UI/_builder/Tmpl/i18n/Translator" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/i18n/Translator.ts
 */

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

