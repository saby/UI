/// <amd-module name="UI/_builder/Tmpl/core/Traverse" />

/**
 * @author Крылов М.А.
 */

import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import * as Names from 'UI/_builder/Tmpl/core/Names';
import { isElementNode } from 'UI/_builder/Tmpl/core/Html';
import { IParser } from '../expressions/_private/Parser';
import { processTextData } from './TextProcessor';
import { IKeysGenerator, createKeysGenerator } from './KeysGenerator';

const enum TraverseState {
   MARKUP,
   COMPONENT,
   COMPONENT_OPTION,
   ARRAY_DATA,
   PRIMITIVE_DATA,
   OBJECT_DATA
}

export interface ITraverseOptions {
   expressionParser: IParser;
   hierarchicalKeys: boolean;
}

interface IAttributesCollection {
   attributes: Ast.IAttributes;
   options: Ast.IOptions;
   events: Ast.IEvents;
}

interface IFilteredAttributes {
   [name: string]: Nodes.Attribute;
}

function filterAttributes(node: Nodes.Tag, expected: string[]): IFilteredAttributes {
   const collection: IFilteredAttributes = { };
   for (const attributeName in node.attributes) {
      if (node.attributes.hasOwnProperty(attributeName)) {
         if (expected.indexOf(attributeName) > -1) {
            collection[attributeName] = node.attributes[attributeName];
         } else {
            throw new Error(`Unexpected attribute "${attributeName}" on tag "${node.name}". Ignore this attribute`);
         }
      }
   }
   return collection;
}

function getDataNode(node: Nodes.Tag, name: string): string {
   const attributes = filterAttributes(node, [name]);
   const data = attributes[name];
   if (data === undefined) {
      throw new Error(`Expected attribute "${name}" on tag "${node.name}". Ignore this tag`);
   }
   if (data.value === null) {
      throw new Error(`Expected attribute "${name}" on tag "${node.name}" has value. Ignore this tag`);
   }
   return data.value;
}

class Traverse implements Nodes.INodeVisitor {
   private stateStack: TraverseState[];
   private expressionParser: IParser;
   private keysGenerator: IKeysGenerator;

   constructor(options: ITraverseOptions) {
      this.stateStack = [];
      this.expressionParser = options.expressionParser;
      this.keysGenerator = createKeysGenerator(options.hierarchicalKeys);
   }

   visitComment(node: Nodes.Comment, context?: any): Ast.CommentNode {
      return new Ast.CommentNode(node.data);
   }

   visitCData(node: Nodes.CData, context?: any): Ast.CDataNode {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.CDataNode(node.data);
         default:
            throw new Error('Unexpected node');
      }
   }

   visitDoctype(node: Nodes.Doctype, context?: any): Ast.DoctypeNode {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.DoctypeNode(node.data);
         default:
            throw new Error('Unexpected node');
      }
   }

   visitInstruction(node: Nodes.Instruction, context?: any): Ast.InstructionNode {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.InstructionNode(node.data);
         default:
            throw new Error('Unexpected node');
      }
   }

   visitTag(node: Nodes.Tag, context?: any): Ast.Ast {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
            return this.processTagInMarkup(node, context);
         case TraverseState.COMPONENT_OPTION:
            return this.processTagInComponentOption(node, context);
         case TraverseState.ARRAY_DATA:
            return this.processTagInArrayData(node, context);
         case TraverseState.PRIMITIVE_DATA:
            return this.processTagInPrimitiveData(node, context);
         case TraverseState.OBJECT_DATA:
            return this.processTagInObjectData(node, context);
         default:
            throw new Error('Unknown state');
      }
   }

   visitText(node: Nodes.Text, context?: any): Ast.TextNode {
      const content = processTextData(node.data, this.expressionParser);
      this.keysGenerator.openChildren();
      for (let index = 0; index < content.length; ++index) {
         content[index].__$ws_key = this.keysGenerator.generate();
      }
      this.keysGenerator.closeChildren();
      return new Ast.TextNode(content);
   }

   transform(nodes: Nodes.Node[], context?: any): Ast.Ast[] {
      this.stateStack.push(TraverseState.MARKUP);
      return this.visitAll(nodes, context);
   }

   visitAll(nodes: Nodes.Node[], context?: any): Ast.Ast[] {
      const children: Ast.Ast[] = [];
      this.keysGenerator.openChildren();
      for (let index = 0; index < nodes.length; ++index) {
         const child = <Ast.Ast>nodes[index].accept(this);
         if (child) {
            child.__$ws_key = this.keysGenerator.generate();
            children.push(child);
         }
      }
      this.keysGenerator.closeChildren();
      return children;
   }

   private getCurrentState(): TraverseState {
      return this.stateStack[this.stateStack.length - 1];
   }

   private processTagInMarkup(node: Nodes.Tag, context?: any): any {
      const strictMarkup = this.getCurrentState() === TraverseState.MARKUP;
      switch (node.name) {
         case 'ws:if':
            return this.processIf(node, context);
         case 'ws:else':
            return this.processElse(node, context);
         case 'ws:for':
            return this.processFor(node, context);
         case 'ws:template':
            return this.processTemplate(node, context);
         case 'ws:partial':
            return this.processPartial(node, context);
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
            throw new Error('Forbidden nodes');
         default:
            if (Names.isComponentOptionName(node.name)) {
               if (strictMarkup) {
                  throw new Error('Unexpected ws-prefixed node in markup');
               }
               return this.processComponentOption(node, context);
            }
            if (Names.isComponentName(node.name)) {
               return this.processComponent(node, context);
            }
            if (isElementNode(node.name)) {
               return this.processElement(node, context);
            }
            throw new Error('Unknown');
      }
   }

   private processTagInComponentOption(node: Nodes.Tag, context?: any): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }

   private processTagInArrayData(node: Nodes.Tag, context?: any): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }

   private processTagInPrimitiveData(node: Nodes.Tag, context?: any): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }

   private processTagInObjectData(node: Nodes.Tag, context?: any): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }

   private processIf(node: Nodes.Tag, context?: any): any {
      throw new Error('Not implemented');
      // TODO: в атрибутах только обязательный data
      //  Создаем узел, парсим данные, переходим к детям
   }

   private processElse(node: Nodes.Tag, context?: any): any {
      throw new Error('Not implemented');
      // TODO: в атрибутах может быть необязательный data
      //  Создаем узел, парсим данные, переходим к детям, проверяем соседний if
   }

   private processFor(node: Nodes.Tag, context?: any): any {
      throw new Error('Not implemented');
      // TODO: в атрибутах только обязательный data
      //  Определяем тип, создаем узел, парсим данные, переходим к детям
   }

   private processTemplate(node: Nodes.Tag, context?: any): any {
      const templateName = getDataNode(node, 'name');
      Names.validateTemplateName(templateName);
      const ast = new Ast.TemplateNode(templateName);
      ast.__$ws_content = <Ast.TContent[]>this.visitAll(node.children, context);
      return ast;
   }

   private processPartial(node: Nodes.Tag, context?: any): any {
      throw new Error('Not implemented');
      // TODO: в атрибутах есть обязательный template
      //  Создаем узел, парсим данные, переходим к детям
   }

   private processComponentOption(node: Nodes.Tag, context?: any): any {
      throw new Error('Not implemented');
   }

   private processComponent(node: Nodes.Tag, context?: any): any {
      throw new Error('Not implemented');
      // TODO: Создаем узел, парсим данные, переходим к детям
   }

   private processElement(node: Nodes.Tag, context?: any): any {
      const attributes = this.visitAttributes(node.attributes, true);
      const ast = new Ast.ElementNode(node.name);
      ast.__$ws_attributes = attributes.attributes;
      ast.__$ws_events = attributes.events;
      ast.__$ws_content = <Ast.TContent[]>this.visitAll(node.children, context);
      return ast;
   }

   private visitAttributes(attributes: Nodes.IAttributes, hasAttributesOnly: boolean): IAttributesCollection {
      const collection: IAttributesCollection = {
         attributes: { },
         options: { },
         events: { }
      };
      for (const attributeName in attributes) {
         if (attributes.hasOwnProperty(attributeName)) {
            const value = attributes[attributeName].value as string;
            if (Names.isBind(attributeName)) {
               const property = Names.getBindName(attributeName);
               if (!collection.events.hasOwnProperty(property)) {
                  collection.events[property] = [];
               }
               collection.events[property].push(
                  new Ast.BindNode(property, this.expressionParser.parse(value))
               );
            } else if (Names.isEvent(attributeName)) {
               const event = Names.getEventName(attributeName);
               if (!collection.events.hasOwnProperty(event)) {
                  collection.events[event] = [];
               }
               collection.events[event].push(
                  new Ast.EventNode(event, this.expressionParser.parse(value))
               );
            } else if (Names.isAttribute(attributeName) || hasAttributesOnly) {
               const attribute = Names.getAttributeName(attributeName);
               const processedValue = processTextData(value, this.expressionParser);
               collection.attributes[attribute] = new Ast.AttributeNode(attribute, processedValue);
            } else {
               const processedValue = processTextData(value, this.expressionParser);
               collection.options[attributeName] = new Ast.OptionNode(attributeName, processedValue);
            }
         }
      }
      return collection;
   }
}

export default function traverse(nodes: Nodes.Node[], options: ITraverseOptions) {
   return new Traverse(options).transform(
      nodes
   );
}
