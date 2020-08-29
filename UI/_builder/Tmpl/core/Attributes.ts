/// <amd-module name="UI/_builder/Tmpl/core/Attributes" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Attributes.ts
 */

import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Ast from './Ast';
import { IParser } from '../expressions/_private/Parser';
import { processTextData } from './TextProcessor';
import { IErrorHandler } from '../utils/ErrorHandler';

const EMPTY_STRING = '';
const ATTR_PREFIX_PATTERN = /^attr:/i;
const BIND_PREFIX_PATTERN = /^bind:/i;
const EVENT_PREFIX_PATTERN = /^on:/i;

const WASABY_ATTRIBUTES = [
   'ws-delegates-tabfocus',
   'ws-creates-context',
   'ws-tab-cycling',
   'ws-autofocus',
   'ws-no-focus',
   'tabindex'
];

export function isAttribute(name: string, check: boolean = false): boolean {
   return ATTR_PREFIX_PATTERN.test(name) || checkAttributesOnly(name, check);
}

function checkAttributesOnly(name: string, check: boolean): boolean {
   return check && WASABY_ATTRIBUTES.indexOf(name) > -1;
}

export function getAttributeName(name: string): string {
   return name.replace(ATTR_PREFIX_PATTERN, EMPTY_STRING);
}

export function isBind(name: string): boolean {
   return BIND_PREFIX_PATTERN.test(name);
}

export function getBindName(name: string): string {
   return name.replace(BIND_PREFIX_PATTERN, EMPTY_STRING);
}

export function isEvent(name: string): boolean {
   return EVENT_PREFIX_PATTERN.test(name);
}

export function getEventName(name: string): string {
   return name.replace(EVENT_PREFIX_PATTERN, EMPTY_STRING);
}

export interface IAttributesCollection {
   attributes: Ast.IAttributes;
   options: Ast.IOptions;
   events: Ast.IEvents;
}

interface IFilteredAttributes {
   [name: string]: Nodes.Attribute;
}

export interface IAttributeProcessorOptions {
   fileName: string;
   hasAttributesOnly: boolean;
}

export interface IAttributeProcessor {
   process(attributes: Nodes.IAttributes, options: IAttributeProcessorOptions): IAttributesCollection;
   filter(attributes: Nodes.IAttributes, expectedAttributeNames: string[], options: IAttributeProcessorOptions): IFilteredAttributes;
}

export interface IAttributeProcessorConfig {
   expressionParser: IParser;
   errorHandler: IErrorHandler;
}

class AttributeProcessor implements IAttributeProcessor {
   private readonly expressionParser: IParser;
   private readonly errorHandler: IErrorHandler;

   constructor(config: IAttributeProcessorConfig) {
      this.expressionParser = config.expressionParser;
      this.errorHandler = config.errorHandler;
   }

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

   private processBind(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions): Ast.BindNode {
      try {
         const property = getBindName(attributeNode.name);
         const programNode = this.expressionParser.parse(attributeNode.value);
         return new Ast.BindNode(property, programNode);
      } catch (error) {
         this.errorHandler.error(
            `В проссе разбора атрибута ${attributeNode.value} возникла ошибка: ${error.message}. Атрибут будет отброшен`,
            {
               fileName: options.fileName,
               position: attributeNode.position
            }
         );
         return null;
      }
   }

   private processEvent(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions): Ast.EventNode {
      try {
         const event = getEventName(attributeNode.name);
         const programNode = this.expressionParser.parse(attributeNode.value);
         return new Ast.EventNode(event, programNode);
      } catch (error) {
         this.errorHandler.error(
            `В проссе разбора атрибута ${attributeNode.value} возникла ошибка: ${error.message}. Атрибут будет отброшен`,
            {
               fileName: options.fileName,
               position: attributeNode.position
            }
         );
         return null;
      }
   }

   private processAttribute(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions): Ast.AttributeNode {
      try {
         const attribute = getAttributeName(attributeNode.name);
         const value = processTextData(attributeNode.value, this.expressionParser);
         if (value.length === 0) {
            throw new Error('значение атрибута не может быть пустым');
         }
         return new Ast.AttributeNode(attribute, value);
      } catch (error) {
         this.errorHandler.error(
            `В проссе разбора атрибута ${attributeNode.value} возникла ошибка: ${error.message}. Атрибут будет отброшен`,
            {
               fileName: options.fileName,
               position: attributeNode.position
            }
         );
         return null;
      }
   }

   private processOption(attributeNode: Nodes.Attribute, options: IAttributeProcessorOptions): Ast.OptionNode {
      try {
         const value = processTextData(attributeNode.value, this.expressionParser);
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
            `В проссе разбора атрибута ${attributeNode.value} возникла ошибка: ${error.message}. Атрибут будет отброшен`,
            {
               fileName: options.fileName,
               position: attributeNode.position
            }
         );
         return null;
      }
   }
}

export function createAttributeProcessor(config: IAttributeProcessorConfig): IAttributeProcessor {
   return new AttributeProcessor(config);
}
