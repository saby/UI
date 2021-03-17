/// <amd-module name="UI/_builder/Tmpl/core/Attributes" />

/**
 * @description Represents attribute processor.
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Attributes.ts
 */

import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import { IParser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import { IErrorHandler } from 'UI/_builder/Tmpl/utils/ErrorHandler';
import { ITextProcessor, TextContentFlags, ITranslationsRegistrar } from 'UI/_builder/Tmpl/core/Text';
import { INodeDescription } from 'UI/_builder/Tmpl/i18n/Translator';
import { IValidator } from 'UI/_builder/Tmpl/expressions/_private/Validator';

/**
 * Empty string constant.
 */
const EMPTY_STRING = '';

/**
 * Whitespace constant.
 */
const WHITESPACE = ' ';

/**
 * Whitespace regular expression.
 */
const WHITESPACE_REGEX = /\s+/gi;

/**
 * Regular expression pattern to determine if attribute name contains a special prefix for attributes.
 */
const ATTR_PREFIX_PATTERN = /^attr:/i;

/**
 * Regular expression pattern to determine if attribute name contains a special prefix for binding constructions.
 */
const BIND_PREFIX_PATTERN = /^bind:/i;

/**
 * Regular expression pattern to determine if attribute name contains a special prefix for event handler expressions.
 */
const EVENT_PREFIX_PATTERN = /^on:/i;

/**
 * HTML boolean attributes that can have no value but 'true' is value by default.
 */
const BOOLEAN_ATTRIBUTES = [
   'allowfullscreen',
   'allowpaymentrequest',
   'async',
   'autofocus',
   'autoplay',
   'checked',
   'contenteditable',
   'controls',
   'default',
   'defer',
   'disabled',
   'formnovalidate',
   'frameborder',
   'hidden',
   'ismap',
   'itemscope',
   'loop',
   'multiple',
   'muted',
   'nomodule',
   'novalidate',
   'open',
   'readonly',
   'required',
   'reversed',
   'selected',
   'typemustmatch'
];

/**
 * Validate attribute value. If it is has no value then use default for known attribute.
 * @param name {string} Attribute name.
 * @param value {string | null} Attribute value.
 */
function validateAttribute(name: string, value: string | null): string | null {
   if (BOOLEAN_ATTRIBUTES.indexOf(name) > -1 && value === null) {
      return 'true';
   }
   return value;
}

/**
 * Collection of special attribute names that are always attributes.
 */
const SPECIAL_ATTRIBUTES_COLLECTION = [
   'ws-delegates-tabfocus',
   'ws-creates-context',
   'ws-tab-cycling',
   'ws-autofocus',
   'ws-no-focus',
   'tabindex',
   'class',
   'data-access'
];

/**
 * Check if attribute name has special attribute prefix.
 * @param name {string} Attribute name.
 */
function hasWasabyPrefix(name: string): boolean {
   return ATTR_PREFIX_PATTERN.test(name);
}

/**
 * Check if attribute name has special attribute prefix.
 * @param name {string} Attribute name.
 */
export function isAttribute(name: string): boolean {
   return hasWasabyPrefix(name) || checkAttributesOnly(name);
}

/**
 *
 * @param name {string} Attribute name.
 */
function checkAttributesOnly(name: string): boolean {
   return SPECIAL_ATTRIBUTES_COLLECTION.indexOf(name) > -1;
}

/**
 * Clean attribute value.
 * @todo Clean values for all attributes.
 * @param name {string} Attribute name.
 * @param value {string} Attribute value.
 */
function cleanAttributeValue(name: string, value: string): string {
   if (name === 'class' || name === 'style') {
      WHITESPACE_REGEX.lastIndex = -1;
      return value.replace(WHITESPACE_REGEX, WHITESPACE);
   }
   return value;
}

/**
 * Get attribute name.
 * If attribute name contains special attribute then it will be removed.
 * @param name {string} Attribute name.
 */
export function getAttributeName(name: string): string {
   return name.replace(ATTR_PREFIX_PATTERN, EMPTY_STRING);
}

/**
 * Check if attribute name has special binding construction prefix.
 * @param name {string} Attribute name.
 */
export function isBind(name: string): boolean {
   return BIND_PREFIX_PATTERN.test(name);
}

/**
 * Get binding constriction attribute name.
 * If attribute name contains special binding constriction prefix then it will be removed.
 * @param name {string} Attribute name.
 */
export function getBindName(name: string): string {
   return name.replace(BIND_PREFIX_PATTERN, EMPTY_STRING);
}

/**
 * Check if attribute name has special event handler prefix.
 * @param name {string} Attribute name.
 */
export function isEvent(name: string): boolean {
   return EVENT_PREFIX_PATTERN.test(name);
}

/**
 * Get event attribute name.
 * If attribute name contains special event handler prefix then it will be removed.
 * @param name {string} Attribute name.
 */
export function getEventName(name: string): string {
   return name.replace(EVENT_PREFIX_PATTERN, EMPTY_STRING);
}

/**
 * Collection of separated and parsed attributes.
 */
export interface IAttributesCollection {

   /**
    * Collection of attribute nodes.
    */
   attributes: Ast.IAttributes;

   /**
    * Collection of option attribute nodes.
    */
   options: Ast.IOptions;

   /**
    * Collection of event handler and binding construction nodes.
    */
   events: Ast.IEvents;
}

/**
 * Collection of filtered attributes. Only contains expected attributes.
 */
interface IFilteredAttributes {
   [name: string]: Nodes.Attribute;
}

/**
 * Interface for attribute processor options.
 */
export interface IAttributeProcessorOptions {

   /**
    * Template file name.
    */
   fileName: string;

   /**
    * Processing option.
    * If option is enabled then all options (attributes without special attribute prefix)
    * will be processed as attributes.
    */
   hasAttributesOnly: boolean;

   /**
    * Parent tag name that contains processing attributes.
    */
   parentTagName: string;

   /**
    * Translations registrar.
    */
   translationsRegistrar: ITranslationsRegistrar;
}

/**
 * Interface for attribute processor.
 */
export interface IAttributeProcessor {

   /**
    * Process raw html attributes collection and create a new collection of
    * separated and parsed attribute nodes.
    * @param attributes {IAttributes} Collection of raw html attributes.
    * @param options {IAttributeProcessorOptions} Processing options.
    * @param nodeDescription {INodeDescription} Processing node description.
    */
   process(attributes: Nodes.IAttributes, options: IAttributeProcessorOptions, nodeDescription?: INodeDescription): IAttributesCollection;

   /**
    * Process raw html attributes collection and create a new collection of
    * processed option nodes.
    * @param attributes {IAttributes} Collection of raw html attributes.
    * @param options {IAttributeProcessorOptions} Processing options.
    */
   processOptions(attributes: Nodes.IAttributes, options: IAttributeProcessorOptions): Ast.IObjectProperties;

   /**
    * Filter raw html attributes collection.
    * @param attributes {IAttributes} Collection of raw html attributes.
    * @param expectedAttributeNames {string[]} Collection of expected attribute names.
    *   All unexpected attributes will be removed and warned.
    * @param options {IAttributeProcessorOptions} Processing options.
    */
   filter(attributes: Nodes.IAttributes, expectedAttributeNames: string[], options: IAttributeProcessorOptions): IFilteredAttributes;

   /**
    * Validate single required attribute in raw attributes collection.
    * Attribute collection will be filtered with single expected attribute name.
    * @param attributes {IAttributes} Collection of raw html attributes.
    * @param name {string} Required attribute name that need to be validated.
    * @param options {IAttributeProcessorOptions} Processing options.
    * @throws {Error} Throws error if attribute is invalid.
    */
   validateValue(attributes: Nodes.IAttributes, name: string, options: IAttributeProcessorOptions): string;
}

/**
 * Interface for attribute processor config.
 */
export interface IAttributeProcessorConfig {

   /**
    * Mustache expressions parser.
    */
   expressionParser: IParser;

   /**
    * Error handler.
    */
   errorHandler: IErrorHandler;

   /**
    * Text processor.
    */
   textProcessor: ITextProcessor;

   /**
    * Mustache-expressions validator.
    */
   expressionValidator: IValidator;

   /**
    * Warn in case of using useless attribute prefix.
    */
   warnUselessAttributePrefix?: boolean;

   /**
    * Warn unknown boolean attributes and options.
    */
   warnBooleanAttributesAndOptions?: boolean;
}

/**
 * Represents methods to process html attributes.
 */
class AttributeProcessor implements IAttributeProcessor {

   /**
    * Mustache expressions parser.
    */
   private readonly expressionParser: IParser;

   /**
    * Error handler.
    */
   private readonly errorHandler: IErrorHandler;

   /**
    * Text processor.
    */
   private readonly textProcessor: ITextProcessor;

   /**
    * Warn in case of using useless attribute prefix.
    */
   private readonly warnUselessAttributePrefix: boolean;

   /**
    * Warn unknown boolean attributes and options.
    */
   private readonly warnBooleanAttributesAndOptions: boolean;

   /**
    * Mustache-expressions validator.
    */
   private readonly expressionValidator: IValidator;

   /**
    * Initialize new instance of attribute processor.
    * @param config {IAttributeProcessorConfig} Attribute processor config.
    */
   constructor(config: IAttributeProcessorConfig) {
      this.expressionParser = config.expressionParser;
      this.errorHandler = config.errorHandler;
      this.textProcessor = config.textProcessor;
      this.warnUselessAttributePrefix = !!config.warnUselessAttributePrefix;
      this.warnUselessAttributePrefix = !!config.warnBooleanAttributesAndOptions;
      this.expressionValidator = config.expressionValidator;
   }

   /**
    * Process raw html attributes collection and create a new collection of
    * separated and parsed attribute nodes.
    * @param attributes {IAttributes} Collection of raw html attributes.
    * @param options {IAttributeProcessorOptions} Processing options.
    * @param nodeDescription {INodeDescription} Processing node description.
    */
   process(attributes: Nodes.IAttributes, options: IAttributeProcessorOptions, nodeDescription?: INodeDescription): IAttributesCollection {
      // FIXME: keep processing attributes order
      let index: number = 0;
      const collection: IAttributesCollection = {
         attributes: { },
         options: { },
         events: { }
      };
      for (const attributeName in attributes) {
         if (attributes.hasOwnProperty(attributeName)) {
            const node = attributes[attributeName];
            if (isBind(attributeName)) {
               const bindNode = this.processBind(node, options);
               if (bindNode) {
                  bindNode.__$ws_key = index++;
                  collection.events[`bind:${bindNode.__$ws_property}`] = bindNode;
               }
               continue;
            }
            if (isEvent(attributeName)) {
               const eventNode = this.processEvent(node, options);
               if (eventNode) {
                  eventNode.__$ws_key = index++;
                  collection.events[`on:${eventNode.__$ws_event}`] = eventNode;
               }
               continue;
            }
            if (isAttribute(attributeName) || options.hasAttributesOnly) {
               const attributeNode = this.processAttribute(node, options, nodeDescription);
               if (isAttribute(attributeName) && options.hasAttributesOnly && this.warnUselessAttributePrefix) {
                  this.errorHandler.warn(
                     `Использование префикса "attr:" не обязательно на html-элементах. Обнаружен атрибут "${attributeName}" на теге "${options.parentTagName}" `,
                     {
                        fileName: options.fileName,
                        position: node.position
                     }
                  );
               }
               if (attributeNode) {
                  attributeNode.__$ws_key = index++;
                  attributeNode.__$ws_hasAttributePrefix = hasWasabyPrefix(attributeName);
                  if (collection.attributes.hasOwnProperty(`attr:${attributeNode.__$ws_name}`)) {
                     this.errorHandler.error(
                        `Атрибут "${attributeName}" уже содержится на теге "${options.parentTagName}"`,
                        {
                           fileName: options.fileName,
                           position: node.position
                        }
                     );
                     continue;
                  }
                  collection.attributes[`attr:${attributeNode.__$ws_name}`] = attributeNode;
               }
               continue;
            }
            const optionNode = this.processOption(node, options, nodeDescription);
            if (optionNode) {
               optionNode.__$ws_key = index++;
               collection.options[optionNode.__$ws_name] = optionNode;
            }
         }
      }
      return collection;
   }

   /**
    * Process raw html attributes collection and create a new collection of
    * processed option nodes.
    * @param attributes {IAttributes} Collection of raw html attributes.
    * @param options {IAttributeProcessorOptions} Processing options.
    */
   processOptions(attributes: Nodes.IAttributes, options: IAttributeProcessorOptions): Ast.IObjectProperties {
      // FIXME: keep processing attributes order
      let index: number = 0;
      const collection: Ast.IObjectProperties = { };
      for (const attributeName in attributes) {
         if (attributes.hasOwnProperty(attributeName)) {
            const node = attributes[attributeName];
            const optionNode = this.processOption(node, options);
            if (optionNode) {
               optionNode.__$ws_key = index++;
               collection[optionNode.__$ws_name] = optionNode;
            }
         }
      }
      return collection;
   }

   /**
    * Filter raw html attributes collection.
    * @param attributes {IAttributes} Collection of raw html attributes.
    * @param expectedAttributeNames {string[]} Collection of expected attribute names.
    *   All unexpected attributes will be removed and warned.
    * @param options {IAttributeProcessorOptions} Processing options.
    */
   filter(attributes: Nodes.IAttributes, expectedAttributeNames: string[], options: IAttributeProcessorOptions): IFilteredAttributes {
      const collection: IFilteredAttributes = { };
      for (const attributeName in attributes) {
         const attribute = attributes[attributeName];
         if (expectedAttributeNames.indexOf(attributeName) > -1) {
            collection[attributeName] = attribute;
         } else {
            this.errorHandler.error(
               `Обнаружен непредусмотренный атрибут "${attributeName}" на теге "${options.parentTagName}". Атрибут будет проигнорирован, его необходимо убрать`,
               {
                  fileName: options.fileName,
                  position: attribute.position
               }
            );
         }
      }
      return collection;
   }

   /**
    * Validate single required attribute in raw attributes collection.
    * Attribute collection will be filtered with single expected attribute name.
    * @param attributes {IAttributes} Collection of raw html attributes.
    * @param name {string} Required attribute name that need to be validated.
    * @param options {IAttributeProcessorOptions} Processing options.
    * @throws {Error} Throws error if attribute is invalid.
    */
   validateValue(attributes: Nodes.IAttributes, name: string, options: IAttributeProcessorOptions): string {
      const collection = this.filter(attributes, [name], options);
      const data = collection[name];
      if (data === undefined) {
         throw new Error(`не обнаружен обязательный атрибут "${name}"`);
      }
      if (data.value === null) {
         throw new Error(`не обнаружено значение обязательного атрибута "${name}"`);
      }
      return data.value;
   }

   /**
    * Parse attribute value and validate its text content.
    * @private
    * @param attributeNode {Attribute} Html attribute node.
    * @param options {IAttributeProcessorOptions} Attribute processor options.
    * @throws {Error} Throws error if attribute is invalid.
    */
   private validateTextValue(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions): string {
      if (attributeNode.value === null) {
         throw new Error('не обнаружено обязательное значение атрибута');
      }
      const processedText = this.textProcessor.process(
         attributeNode.value,
         {
            fileName: options.fileName,
            allowedContent: TextContentFlags.TEXT,
            translateText: false,
            translationsRegistrar: options.translationsRegistrar,
            position: attributeNode.position
         }
      );
      return (<Ast.TextDataNode>processedText[0]).__$ws_content;
   }

   /**
    * Process binding construction node.
    * @private
    * @param attributeNode {Attribute} Html attribute node.
    * @param options {IAttributeProcessorOptions} Attribute processor options.
    * @returns {BindNode} Binding construction node, or null if processing failed.
    */
   private processBind(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions): Ast.BindNode {
      try {
         const property = getBindName(attributeNode.name);
         const value = this.validateTextValue(attributeNode, options);
         const programNode = this.expressionParser.parse(value);
         this.expressionValidator.checkBindExpression(
            programNode,
            {
               fileName: options.fileName,
               position: attributeNode.position
            }
         );
         return new Ast.BindNode(property, programNode);
      } catch (error) {
         this.errorHandler.critical(
            `В процессе разбора атрибута "${attributeNode.name}" на теге "${options.parentTagName}" возникла ошибка: ${error.message}`,
            {
               fileName: options.fileName,
               position: attributeNode.position
            }
         );
         return null;
      }
   }

   /**
    * Process event handler node.
    * @private
    * @param attributeNode {Attribute} Html attribute node.
    * @param options {IAttributeProcessorOptions} Attribute processor options.
    * @returns {EventNode} Event node, or null if processing failed.
    */
   private processEvent(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions): Ast.EventNode {
      try {
         const event = getEventName(attributeNode.name);
         const value = this.validateTextValue(attributeNode, options);
         const programNode = this.expressionParser.parse(value);
         this.expressionValidator.checkEventExpression(
            programNode,
            {
               fileName: options.fileName,
               position: attributeNode.position
            }
         );
         return new Ast.EventNode(event, programNode);
      } catch (error) {
         this.errorHandler.critical(
            `В процессе разбора атрибута "${attributeNode.name}" на теге "${options.parentTagName}" возникла ошибка: ${error.message}`,
            {
               fileName: options.fileName,
               position: attributeNode.position
            }
         );
         return null;
      }
   }

   /**
    * Process attribute node.
    * @private
    * @param attributeNode {Attribute} Html attribute node.
    * @param options {IAttributeProcessorOptions} Attribute processor options.
    * @returns {AttributeNode} Attribute node, or null if processing failed.
    * @param nodeDescription {INodeDescription} Processing node description.
    */
   private processAttribute(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions, nodeDescription?: INodeDescription): Ast.AttributeNode {
      try {
         const attribute = getAttributeName(attributeNode.name);
         const attributeValue = validateAttribute(attribute, attributeNode.value);
         if (attributeValue === null) {
            if (this.warnBooleanAttributesAndOptions) {
               this.errorHandler.warn(
                  `Обнаружен атрибут "${attributeNode.name}" на теге "${options.parentTagName}", которому не было задано значение`,
                  {
                     fileName: options.fileName,
                     position: attributeNode.position
                  }
               );
            }
            return new Ast.AttributeNode(
               attribute,
               [
                  new Ast.TextDataNode('')
               ]
            );
         }
         const translateText = nodeDescription
            ? (
               nodeDescription.isAttributeTranslatable(attribute)
               // FIXME: attr:title have never been translated
               && attributeNode.name !== 'attr:title'
            )
            : false;
         const cleanValue = cleanAttributeValue(attribute, attributeValue);
         const value = this.textProcessor.process(
            cleanValue,
            {
               fileName: options.fileName,
               allowedContent: TextContentFlags.FULL_TEXT,
               translateText,
               translationsRegistrar: options.translationsRegistrar,
               position: attributeNode.position
            }
         );
         return new Ast.AttributeNode(attribute, value);
      } catch (error) {
         this.errorHandler.critical(
            `В процессе разбора атрибута "${attributeNode.name}" на теге "${options.parentTagName}" возникла ошибка: ${error.message}`,
            {
               fileName: options.fileName,
               position: attributeNode.position
            }
         );
         return null;
      }
   }

   /**
    * Process option node.
    * @private
    * @param attributeNode {Attribute} Html attribute node.
    * @param options {IAttributeProcessorOptions} Attribute processor options.
    * @returns {OptionNode} Option node, or null if processing failed.
    * @param nodeDescription {INodeDescription} Processing node description.
    */
   private processOption(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions, nodeDescription?: INodeDescription): Ast.OptionNode {
      try {
         const attributeValue = attributeNode.value;
         let value = null;
         if (attributeValue === null) {
            if (this.warnBooleanAttributesAndOptions) {
               this.errorHandler.warn(
                  `Обнаружена опция "${attributeNode.name}" на теге "${options.parentTagName}", которой не было задано значение`,
                  {
                     fileName: options.fileName,
                     position: attributeNode.position
                  }
               );
            }
            value = [new Ast.TextDataNode('')];
         } else {
            value = this.textProcessor.process(
               attributeValue,
               {
                  fileName: options.fileName,
                  allowedContent: TextContentFlags.FULL_TEXT,
                  translateText: nodeDescription ? nodeDescription.isOptionTranslatable(attributeNode.name) : false,
                  translationsRegistrar: options.translationsRegistrar,
                  position: attributeNode.position
               }
            );
         }
         const valueNode = new Ast.ValueNode(value);
         valueNode.setFlag(Ast.Flags.TYPE_CASTED);
         const option = new Ast.OptionNode(
            attributeNode.name,
            valueNode
         );
         option.setFlag(Ast.Flags.UNPACKED);
         return option;
      } catch (error) {
         this.errorHandler.critical(
            `В процессе разбора атрибута "${attributeNode.name}" на теге "${options.parentTagName}" возникла ошибка: ${error.message}`,
            {
               fileName: options.fileName,
               position: attributeNode.position
            }
         );
         return null;
      }
   }
}

/**
 * Create new instance of attribute processor.
 * @param config {IAttributeProcessorConfig} Attribute processor config.
 * @returns {IAttributeProcessor} Returns new instance of attribute processor that implements IAttributeProcessor interface.
 */
export function createAttributeProcessor(config: IAttributeProcessorConfig): IAttributeProcessor {
   return new AttributeProcessor(config);
}
