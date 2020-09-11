/// <amd-module name="UI/_builder/Tmpl/i18n/Translator" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/i18n/Translator.ts
 */

import createJSDocProcessor, { IJSDocProcessor, IJSDocSchema, IComponentDescription } from 'UI/_builder/Tmpl/i18n/JSDoc';

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
class ComponentDescription extends ElementDescription {

   /**
    * @todo
    */
   private readonly componentDescription: IComponentDescription;

   /**
    * @todo
    * @param translatableAttributeNames {string[]}
    * @param componentDescription {IComponentDescription}
    */
   constructor(translatableAttributeNames: string[], componentDescription: IComponentDescription) {
      super(translatableAttributeNames);
      this.componentDescription = componentDescription;
   }

   /**
    * @todo
    * @param name {string}
    */
   isOptionTranslatable(name: string): boolean {
      return this.componentDescription.isPropertyTranslatable(name);
   }
}

/**
 * @todo
 */
const TRANSLATABLE_ELEMENT_ATTRIBUTES = [
   'title'
];

/**
 * @todo
 */
const ELEMENT_DESCRIPTION = new ElementDescription(TRANSLATABLE_ELEMENT_ATTRIBUTES);

/**
 * @todo
 */
class TextTranslator implements ITextTranslator {

   private readonly jsDocProcessor: IJSDocProcessor;

   /**
    * @todo
    */
   constructor(jsDocSchema: IJSDocSchema) {
      this.jsDocProcessor = createJSDocProcessor(jsDocSchema);
   }

   /**
    * @todo
    * @param name {string}
    */
   isElementContentTranslatable(name: string): boolean {
      return FORBIDDEN_CONTENT_TRANSLATION.indexOf(name) === -1;
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
    * @param componentPath {string}
    */
   getComponentDescription(componentPath: string): INodeDescription {
      const componentDescription = this.jsDocProcessor.getComponentDescription(componentPath);
      return new ComponentDescription(TRANSLATABLE_ELEMENT_ATTRIBUTES, componentDescription);
   }
}

/**
 * @todo
 */
export function createTextTranslator(jsDocSchema: IJSDocSchema): ITextTranslator {
   return new TextTranslator(jsDocSchema);
}

