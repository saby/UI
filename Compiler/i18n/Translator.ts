/**
 * @description Represents interfaces and methods to work with ast node translations.
 * @author Крылов М.А.
 * @file Compiler/i18n/Translator.ts
 */

import createJSDocProcessor, { IJSDocProcessor, IJSDocSchema, IComponentDescription } from './JSDoc';

/**
 * Interface for raw tag node description.
 */
export interface INodeDescription {

   /**
    * Check if tag attribute is translatable.
    * @param name {string} Tag attribute name.
    * @returns {boolean} Returns true in case of translatable tag attribute.
    */
   isAttributeTranslatable(name: string): boolean;

   /**
    * Check if tag option is translatable.
    * @param name {string} Tag option name.
    * @returns {boolean} Returns true in case of translatable tag option.
    */
   isOptionTranslatable(name: string): boolean;
}

/**
 * Interface for text translator.
 */
export interface ITextTranslator {

   /**
    * Check if content of element is translatable.
    * @param name {string} Element name.
    * @returns {boolean} Returns true in case of translatable element content.
    */
   isElementContentTranslatable(name: string): boolean;

   /**
    * Get tag node description.
    * @param name {string} Tag node name.
    * @returns {INodeDescription} Returns tag node description.
    */
   getElementDescription(name: string): INodeDescription;

   /**
    * Get component node description.
    * @param componentPath {string} Component tag name.
    * @returns {INodeDescription} Returns component node description.
    */
   getComponentDescription(componentPath: string): INodeDescription;
}

/**
 * Collection of html element names which content do not translate.
 */
const FORBIDDEN_CONTENT_TRANSLATION = [
   'style',
   'script'
];

/**
 * Represents element node description.
 */
class ElementDescription implements INodeDescription {

   /**
    * Collection of translatable attribute names.
    */
   private readonly translatableAttributeNames: string[];

   /**
    * Initialize new instance of element node description.
    * @param translatableAttributeNames {string[]} Collection of translatable attribute names.
    */
   constructor(translatableAttributeNames: string[]) {
      this.translatableAttributeNames = translatableAttributeNames;
   }

   /**
    * Check if tag attribute is translatable.
    * @param name {string} Tag attribute name.
    * @returns {boolean} Returns true in case of translatable tag attribute.
    */
   isAttributeTranslatable(name: string): boolean {
      return this.translatableAttributeNames.indexOf(name) > -1;
   }

   /**
    *Check if tag option is translatable.
    * @param name {string} Tag option name.
    * @returns {boolean} Returns true in case of translatable tag option.
    */
   isOptionTranslatable(name: string): boolean {
      return false;
   }
}

/**
 * Represents component node description.
 */
class ComponentDescription extends ElementDescription {

   /**
    * Component description.
    */
   private readonly componentDescription: IComponentDescription;

   /**
    * Initialize new instance of element node description.
    * @param translatableAttributeNames {string[]} Collection of translatable attribute names.
    * @param componentDescription {IComponentDescription} Component description.
    */
   constructor(translatableAttributeNames: string[], componentDescription: IComponentDescription) {
      super(translatableAttributeNames);
      this.componentDescription = componentDescription;
   }

   /**
    * Check if tag option is translatable.
    * @param name {string} Tag option name.
    * @returns {boolean} Returns true in case of translatable tag option.
    */
   isOptionTranslatable(name: string): boolean {
      return this.componentDescription.isPropertyTranslatable(name);
   }
}

/**
 * Collection of element node names which content is translatable.
 */
const TRANSLATABLE_ELEMENT_ATTRIBUTES = [
   'title'
];

/**
 * Default element node description.
 */
const ELEMENT_DESCRIPTION = new ElementDescription(TRANSLATABLE_ELEMENT_ATTRIBUTES);

/**
 * Represents methods to work with JSDOC data.
 */
class TextTranslator implements ITextTranslator {

   /**
    * JSDoc processor.
    */
   private readonly jsDocProcessor: IJSDocProcessor;

   /**
    * Initialize new instance of text translator.
    * @param jsDocSchema {IJSDocSchema} JSDOC schema.
    */
   constructor(jsDocSchema: IJSDocSchema) {
      this.jsDocProcessor = createJSDocProcessor(jsDocSchema);
   }

   /**
    * Check if content of element is translatable.
    * @param name {string} Element name.
    * @returns {boolean} Returns true in case of translatable element content.
    */
   isElementContentTranslatable(name: string): boolean {
      return FORBIDDEN_CONTENT_TRANSLATION.indexOf(name) === -1;
   }

   /**
    * Get tag node description.
    * @param name {string} Tag node name.
    * @returns {INodeDescription} Returns tag node description.
    */
   getElementDescription(name: string): INodeDescription {
      return ELEMENT_DESCRIPTION;
   }

   /**
    * Get component node description.
    * @param componentPath {string} Component tag name.
    * @returns {INodeDescription} Returns component node description.
    */
   getComponentDescription(componentPath: string): INodeDescription {
      const componentDescription = this.jsDocProcessor.getComponentDescription(componentPath);
      return new ComponentDescription(TRANSLATABLE_ELEMENT_ATTRIBUTES, componentDescription);
   }
}

/**
 * Create text translator.
 * @param jsDocSchema {IJSDocSchema} JSDOC schema.
 * @returns {ITextTranslator} Returns text translator.
 */
export function createTextTranslator(jsDocSchema: IJSDocSchema): ITextTranslator {
   return new TextTranslator(jsDocSchema);
}

