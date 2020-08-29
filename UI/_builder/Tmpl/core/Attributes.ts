/// <amd-module name="UI/_builder/Tmpl/core/Attributes" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Attributes.ts
 */

import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Ast from './Ast';
import { IParser } from '../expressions/_private/Parser';
import { IErrorHandler } from '../utils/ErrorHandler';
import { ITextProcessor, TextContentFlags } from 'UI/_builder/Tmpl/core/Text';

/**
 * Empty string constant.
 */
const EMPTY_STRING = '';

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
 * Collection of special attribute names that are always attributes.
 */
const SPECIAL_ATTRIBUTES_COLLECTION = [
   'ws-delegates-tabfocus',
   'ws-creates-context',
   'ws-tab-cycling',
   'ws-autofocus',
   'ws-no-focus',
   'tabindex'
];

/**
 * Check if attribute name has special attribute prefix.
 * @param name {string} Attribute name.
 * @param check {boolean} Check or not if attribute name contains in collection of special attribute names.
 */
export function isAttribute(name: string, check: boolean = false): boolean {
   return ATTR_PREFIX_PATTERN.test(name) || checkAttributesOnly(name, check);
}

/**
 *
 * @param name {string} Attribute name.
 * @param check {boolean} Do check or not.
 */
function checkAttributesOnly(name: string, check: boolean): boolean {
   return check && SPECIAL_ATTRIBUTES_COLLECTION.indexOf(name) > -1;
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
    */
   process(attributes: Nodes.IAttributes, options: IAttributeProcessorOptions): IAttributesCollection;

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
    * Initialize new instance of attribute processor.
    * @param config {IAttributeProcessorConfig} Attribute processor config.
    */
   constructor(config: IAttributeProcessorConfig) {
      this.expressionParser = config.expressionParser;
      this.errorHandler = config.errorHandler;
      this.textProcessor = config.textProcessor;
   }

   /**
    * Process raw html attributes collection and create a new collection of
    * separated and parsed attribute nodes.
    * @param attributes {IAttributes} Collection of raw html attributes.
    * @param options {IAttributeProcessorOptions} Processing options.
    */
   process(attributes: Nodes.IAttributes, options: IAttributeProcessorOptions): IAttributesCollection {
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
                  collection.events[`bind:${bindNode.__$ws_property}`] = bindNode;
               }
               continue;
            }
            if (isEvent(attributeName)) {
               const eventNode = this.processEvent(node, options);
               if (eventNode) {
                  collection.events[`on:${eventNode.__$ws_event}`] = eventNode;
               }
               continue;
            }
            if (isAttribute(attributeName) || options.hasAttributesOnly) {
               const attributeNode = this.processAttribute(node, options);
               if (attributeNode) {
                  collection.attributes[`attr:${attributeNode.__$ws_name}`] = attributeNode;
               }
               continue;
            }
            const optionNode = this.processOption(node, options);
            if (optionNode) {
               collection.options[optionNode.__$ws_name] = optionNode;
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
            this.errorHandler.warn(
               `Обнаружен непредусмотренный атрибут "${attributeName}". ` +
               'Данный атрибут будет отброшен',
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
         throw new Error(`ожидался обязательный атрибут "${name}"`);
      }
      if (data.value === null) {
         throw new Error(`ожидалось, что обязательный атрибут "${name}" имеет значение`);
      }
      return data.value;
   }

   /**
    * Parse attribute value and validate its text content.
    * @param attributeNode {Attribute} Html attribute node.
    * @param options {IAttributeProcessorOptions} Attribute processor options.
    * @throws {Error} Throws error if attribute is invalid.
    */
   private validateTextValue(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions): string {
      const processedText = this.textProcessor.process(
         attributeNode.value,
         {
            fileName: options.fileName,
            allowedContent: TextContentFlags.TEXT
         },
         attributeNode.position
      );
      if (processedText.length !== 1) {
         throw new Error('некорректные данные');
      }
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
         return new Ast.BindNode(property, programNode);
      } catch (error) {
         this.errorHandler.error(
            `В процессе разбора атрибута ${attributeNode.name} возникла ошибка: ${error.message}. Атрибут будет отброшен`,
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
         return new Ast.EventNode(event, programNode);
      } catch (error) {
         this.errorHandler.error(
            `В процессе разбора атрибута ${attributeNode.name} возникла ошибка: ${error.message}. Атрибут будет отброшен`,
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
    */
   private processAttribute(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions): Ast.AttributeNode {
      try {
         const attribute = getAttributeName(attributeNode.name);
         const value = this.textProcessor.process(
            attributeNode.value,
            {
               fileName: options.fileName,
               allowedContent: TextContentFlags.FULL_TEXT
            },
            attributeNode.position
         );
         if (value.length === 0) {
            throw new Error('значение атрибута не может быть пустым');
         }
         return new Ast.AttributeNode(attribute, value);
      } catch (error) {
         this.errorHandler.error(
            `В процессе разбора атрибута ${attributeNode.name} возникла ошибка: ${error.message}. Атрибут будет отброшен`,
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
    */
   private processOption(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions): Ast.OptionNode {
      try {
         const value = this.textProcessor.process(
            attributeNode.value,
            {
               fileName: options.fileName,
               allowedContent: TextContentFlags.FULL_TEXT
            },
            attributeNode.position
         );
         if (value.length === 0) {
            throw new Error('значение атрибута не может быть пустым');
         }
         const valueNode = new Ast.ValueNode(value);
         valueNode.setFlag(Ast.Flags.TYPE_CASTED);
         return new Ast.OptionNode(
            attributeNode.name,
            valueNode
         );
      } catch (error) {
         this.errorHandler.error(
            `В процессе разбора атрибута ${attributeNode.name} возникла ошибка: ${error.message}. Атрибут будет отброшен`,
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
