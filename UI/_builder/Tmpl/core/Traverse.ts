/// <amd-module name="UI/_builder/Tmpl/core/Traverse" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Traverse.ts
 */

import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import { isElementNode } from 'UI/_builder/Tmpl/core/Html';
import { IParser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { IKeysGenerator, createKeysGenerator } from 'UI/_builder/Tmpl/core/KeysGenerator';
import { IErrorHandler } from 'UI/_builder/Tmpl/utils/ErrorHandler';
import { IAttributeProcessor, createAttributeProcessor } from 'UI/_builder/Tmpl/core/Attributes';
import { ITextProcessor, createTextProcessor, TextContentFlags } from 'UI/_builder/Tmpl/core/Text';
import Scope from 'UI/_builder/Tmpl/core/Scope';
import * as Resolvers from 'UI/_builder/Tmpl/core/Resolvers';

// <editor-fold desc="Public interfaces and functions">

export interface ITraverse extends Nodes.INodeVisitor {
   transform(nodes: Nodes.Node[], options: ITraverseOptions): Ast.Ast[];
}

export interface ITraverseConfig {
   expressionParser: IParser;
   hierarchicalKeys: boolean;
   errorHandler: IErrorHandler;
   allowComments: boolean;
}

export interface ITraverseOptions {
   fileName: string;
   scope: Scope;
}

export default function traverse(nodes: Nodes.Node[], config: ITraverseConfig, options: ITraverseOptions): Ast.Ast[] {
   return new Traverse(config).transform(
      nodes,
      options
   );
}

// </editor-fold>

// <editor-fold desc="Internal finite state machine states and interfaces">

/**
 * Traverse machine states.
 */
const enum TraverseState {

   /**
    * In processing html elements and html directives.
    */
   MARKUP,

   /**
    * In processing component or partial that contains either content or options.
    */
   COMPONENT,

   /**
    * In processing component or partial where only content is allowed.
    */
   COMPONENT_WITH_CONTENT,

   /**
    * In processing component or partial where only options are allowed.
    */
   COMPONENT_WITH_OPTION,

   /**
    * In processing array type node where only data types node are allowed.
    */
   ARRAY_DATA,

   /**
    * In processing primitive type node content where only text is allowed.
    */
   PRIMITIVE_DATA,

   /**
    * In processing object type node content where only options are allowed.
    */
   OBJECT_DATA,

   COMPONENT_OPTION
}

interface ITraverseContext {
   scope: Scope;
   fileName: string;
   prev: Ast.Ast | null;
   state: TraverseState;
   textContent?: TextContentFlags;
}

// </editor-fold>

// <editor-fold desc="Internal finite state machine functions">

function validateElseNode(prev: Ast.Ast | null) {
   if (prev instanceof Ast.IfNode) {
      return;
   }
   if (prev instanceof Ast.ElseNode) {
      if (!prev.isElif()) {
         throw new Error(
            'Ожидалось, что директива ws:else следует за директивной ws:else, на котором задан атрибут data'
         );
      }
      return;
   }
   throw new Error('Ожидалось, что директива ws:else следует за директивной ws:if или ws:else с атрибутом data');
}

function validateBoolean(children: Ast.TextNode[]): void {
   if (children.length === 0) {
      throw new Error('не задано значение');
   }
   if (children.length !== 1) {
      throw new Error('данные некорректного типа');
   }
   const data = children[0].__$ws_content;
   for (let index = 0; index < data.length; ++index) {
      const child = data[index];
      if (child instanceof Ast.TextDataNode) {
         if (child.__$ws_content !== 'true' && child.__$ws_content !== 'false') {
            throw new Error('ожидалось одно из значений - true/false');
         }
      }
      if (child instanceof Ast.TranslationNode) {
         throw new Error('использование локализации недопустимо');
      }
   }
}

function validateNumber(children: Ast.TextNode[]): void {
   if (children.length === 0) {
      throw new Error('не задано значение');
   }
   if (children.length !== 1) {
      throw new Error('данные некорректного типа');
   }
   const data = children[0].__$ws_content;
   for (let index = 0; index < data.length; ++index) {
      const child = data[index];
      if (child instanceof Ast.TextDataNode) {
         if (Number.isNaN(+child.__$ws_content)) {
            throw new Error(`получено нечисловое значение -"${child.__$ws_content}"`);
         }
      }
      if (child instanceof Ast.TranslationNode) {
         throw new Error('использование локализации недопустимо');
      }
   }
}

function validatePartialTemplate(option: Ast.OptionNode | undefined, node: Nodes.Tag): ProgramNode | string {
   if (option === undefined) {
      throw new Error('не задана обязательная опция "template"');
   }
   const data = (<Ast.ValueNode>option.__$ws_value).__$ws_data;
   let value: ProgramNode | string = null;
   let current: ProgramNode | string;
   for (let index = 0; index < data.length; ++index) {
      current = null;
      if (data[index] instanceof Ast.ExpressionNode) {
         current = (<Ast.ExpressionNode>data[index]).__$ws_program;
      }
      if (data[index] instanceof Ast.TextDataNode) {
         current = (<Ast.TextDataNode>data[index]).__$ws_content;
      }
      if (data[index] instanceof Ast.TranslationNode) {
         throw new Error('не задана обязательная опция "template"');
      }
      if (current !== null && value !== null) {
         throw new Error(`некорректно задана опция "template" - "${node.attributes.template.value}"`);
      }
      value = current;
   }
   if (value === null) {
      throw new Error('не задано значение обязательной опции "template"');
   }
   return value;
}

function containsContentOnly(nodes: Ast.Ast[]): boolean {
   for (let index = 0; index < nodes.length; ++index) {
      if (!Ast.isTypeofContent(nodes[index])) {
         return false;
      }
   }
   return true;
}

// </editor-fold>

class Traverse implements ITraverse {

   // <editor-fold desc="Traverse properties">

   private readonly expressionParser: IParser;
   private readonly keysGenerator: IKeysGenerator;
   private readonly errorHandler: IErrorHandler;
   private readonly allowComments: boolean;
   private readonly attributeProcessor: IAttributeProcessor;
   private readonly textProcessor: ITextProcessor;

   // </editor-fold>

   /**
    * Initialize new instance of traverse machine.
    * @param config {ITraverseConfig} Traverse machine configuration.
    */
   constructor(config: ITraverseConfig) {
      this.expressionParser = config.expressionParser;
      this.keysGenerator = createKeysGenerator(config.hierarchicalKeys);
      this.errorHandler = config.errorHandler;
      this.allowComments = config.allowComments;
      this.textProcessor = createTextProcessor({
         expressionParser: config.expressionParser
      });
      this.attributeProcessor = createAttributeProcessor({
         expressionParser: config.expressionParser,
         errorHandler: config.errorHandler,
         textProcessor: this.textProcessor
      });
   }

   /**
    * Transform html tree into abstract syntax tree.
    * @param nodes {Node[]} Collection of html nodes.
    * @param options {ITraverseOptions} Transform options.
    */
   transform(nodes: Nodes.Node[], options: ITraverseOptions): Ast.Ast[] {
      const context: ITraverseContext = {
         prev: null,
         state: TraverseState.MARKUP,
         fileName: options.fileName,
         scope: options.scope
      };
      const tree = this.visitAll(nodes, context);
      this.removeUnusedTemplates(context);
      return tree;
   }

   /**
    * Visit all nodes in collection of html nodes.
    * @param nodes {Node[]} Collection of html nodes.
    * @param context {ITraverseContext} Processing context.
    */
   visitAll(nodes: Nodes.Node[], context: ITraverseContext): Ast.Ast[] {
      const children: Ast.Ast[] = [];
      const childContext: ITraverseContext = {
         ...context
      };
      this.keysGenerator.openChildren();
      for (let index = 0; index < nodes.length; ++index) {
         childContext.prev = children[children.length - 1] || null;
         const child = <Ast.Ast>nodes[index].accept(this, childContext);
         if (child) {
            child.setKey(
               this.keysGenerator.generate()
            );
            children.push(child);
         }
      }
      this.keysGenerator.closeChildren();
      return children;
   }

   // <editor-fold desc="Processing html nodes">

   /**
    * Process html comment node and create comment node of abstract syntax tree.
    * @param node {Comment} Html comment node.
    * @param context {ITraverseContext} Processing context.
    * @returns {CommentNode | null} Returns instance of CommentNode or null in case of broken content.
    */
   visitComment(node: Nodes.Comment, context: ITraverseContext): Ast.CommentNode {
      if (this.allowComments) {

         // TODO: right now creating comment nodes will break traverse machine.
         //  In future we need to support creating ignorable comment nodes
         //  in whole abstract syntax tree.
         return new Ast.CommentNode(node.data);
      }
      return null;
   }

   /**
    * Process html CData node and create CData node of abstract syntax tree.
    * @param node {Text} Html CData node.
    * @param context {ITraverseContext} Processing context.
    * @returns {CDataNode | null} Returns instance of CDataNode or null in case of broken content.
    */
   visitCData(node: Nodes.CData, context: ITraverseContext): Ast.CDataNode {
      switch (context.state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.CDataNode(node.data);
         default:
            this.errorHandler.error(
               'Использование тега CData запрещено в данном контексте',
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   /**
    * Process html Doctype node and create Doctype node of abstract syntax tree.
    * @param node {Doctype} Html Doctype node.
    * @param context {ITraverseContext} Processing context.
    * @returns {DoctypeNode | null} Returns instance of DoctypeNode or null in case of broken content.
    */
   visitDoctype(node: Nodes.Doctype, context: ITraverseContext): Ast.DoctypeNode {
      switch (context.state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.DoctypeNode(node.data);
         default:
            this.errorHandler.error(
               'Использование тега Doctype запрещено в данном контексте',
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   /**
    * Process html instruction node and create instruction node of abstract syntax tree.
    * @param node {Instruction} Html instruction node.
    * @param context {ITraverseContext} Processing context.
    * @returns {InstructionNode | null} Returns instance of InstructionNode or null in case of broken content.
    */
   visitInstruction(node: Nodes.Instruction, context: ITraverseContext): Ast.InstructionNode {
      switch (context.state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.InstructionNode(node.data);
         default:
            this.errorHandler.error(
               'Использование тега Instruction запрещено в данном контексте',
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   /**
    * Process html text node and create shared text node of abstract syntax tree.
    * @param node {Text} Html text node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TextNode | null} Returns instance of TextNode or null in case of broken content.
    */
   visitText(node: Nodes.Text, context: ITraverseContext): Ast.TextNode {
      try {
         // Process text node content.
         // If text is invalid then an error will be thrown.
         const content = this.textProcessor.process(node.data, {
            fileName: context.fileName,
            allowedContent: context.textContent || TextContentFlags.FULL_TEXT
         }, node.position);

         // Set keys onto text content nodes.
         this.keysGenerator.openChildren();
         for (let index = 0; index < content.length; ++index) {
            content[index].setKey(
               this.keysGenerator.generate()
            );
         }
         this.keysGenerator.closeChildren();

         // Pack the processed data
         return new Ast.TextNode(content);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка обработки текста: ${error.message}. Текст будет отброшен`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process html tag node and create concrete node of abstract syntax tree.
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {Ast | null} Returns instance of concrete Ast or null in case of broken content.
    */
   visitTag(node: Nodes.Tag, context: ITraverseContext): Ast.Ast {
      return this.processTag(node, context);
   }

   // </editor-fold>

   /**
    * Process tag node in concrete state.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {Ast | null} Returns concrete instance of Ast or null in case of broken tag node.
    */
   private processTag(node: Nodes.Tag, context: ITraverseContext): Ast.Ast {
      switch (context.state) {
         case TraverseState.MARKUP:
            return this.processTagInMarkup(node, context);
         case TraverseState.COMPONENT:
            return this.processTagInComponent(node, context);
         case TraverseState.COMPONENT_OPTION:
            return this.processTagInComponentOption(node, context);
         case TraverseState.ARRAY_DATA:
            return this.processTagInArrayData(node, context);
         case TraverseState.PRIMITIVE_DATA:
            this.errorHandler.error(
               `Обнаружен тег "${node.name}", когда ожидалось текстовое содержимое. Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         case TraverseState.OBJECT_DATA:
            return this.processTagInObjectData(node, context);
         default:
            this.errorHandler.critical('Конечный автомат traverse находится в неизвестном состоянии', {
               fileName: context.fileName,
               position: node.position
            });
            return null;
      }
   }

   /**
    * Process tag node in markup state.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | null} Returns concrete instance of TContent type or null in case of broken tag node.
    */
   private processTagInMarkup(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
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
            this.errorHandler.error(
               `Использование директивы "${node.name}" вне описания опции запрещено. Директива будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         default:
            if (Resolvers.isOption(node.name)) {
               this.errorHandler.error(
                  `Обнаружена неизвестная директива "${node.name}". Директива будет отброшена`,
                  {
                     fileName: context.fileName,
                     position: node.position
                  }
               );
               return null;
            }
            if (Resolvers.isComponent(node.name)) {
               return this.processComponent(node, context);
            }

            // We need to check element node even if element node is broken.
            const elementNode = this.processElement(node, context);
            if (isElementNode(node.name)) {
               return elementNode;
            }
            this.errorHandler.error(
               `Обнаружен неизвестный HTML тег "${node.name}". Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   /**
    * Process tag node in markup state.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | ContentOptionNode | OptionNode | null} Returns concrete instance of TContent type or null in case of broken tag node.
    */
   private processTagInComponent(node: Nodes.Tag, context: ITraverseContext): Ast.TContent | Ast.ContentOptionNode | Ast.OptionNode {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:partial':
            return this.processComponentContent(node, context);
         case 'ws:template':
            return this.processComponentOption(node, context);
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
            this.errorHandler.error(
               `Использование директивы "${node.name}" вне описания опции запрещено. Директива будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         default:
            if (Resolvers.isOption(node.name)) {
               return this.processComponentOption(node, context);
            }

            // We need to check component content node even if node is broken.
            const componentContent = this.processComponentContent(node, context);
            if (Resolvers.isComponent(node.name) || isElementNode(node.name)) {
               return componentContent;
            }
            this.errorHandler.error(
               `Обнаружен неизвестный HTML тег "${node.name}". Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   private processTagInComponentOption(node: Nodes.Tag, context: ITraverseContext): Ast.TData | Ast.TContent | Ast.ContentOptionNode | Ast.OptionNode {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:partial':
            return this.processComponentContent(node, context);
         case 'ws:template':
            return this.castAndProcessObjectProperty(node, context);
         case 'ws:Array':
            return this.processArray(node, context);
         case 'ws:Boolean':
            return this.processBoolean(node, context);
         case 'ws:Function':
            return this.processFunction(node, context);
         case 'ws:Number':
            return this.processNumber(node, context);
         case 'ws:Object':
            return this.processObject(node, context);
         case 'ws:String':
            return this.processString(node, context);
         case 'ws:Value':
            return this.processValue(node, context);
         default:
            if (Resolvers.isOption(node.name)) {
               return this.castAndProcessObjectProperty(node, context);
            }
            if (Resolvers.isComponent(node.name) || isElementNode(node.name)) {
               return this.processComponentContent(node, context);
            }
            this.errorHandler.error(
               `Обнаружен неизвестный HTML тег "${node.name}". Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   private processTagInArrayData(node: Nodes.Tag, context: ITraverseContext): Ast.TData {
      switch (node.name) {
         case 'ws:Array':
            return this.processArray(node, context);
         case 'ws:Boolean':
            return this.processBoolean(node, context);
         case 'ws:Function':
            return this.processFunction(node, context);
         case 'ws:Number':
            return this.processNumber(node, context);
         case 'ws:Object':
            return this.processObject(node, context);
         case 'ws:String':
            return this.processString(node, context);
         case 'ws:Value':
            return this.processValue(node, context);
         default:
            this.errorHandler.error(
               `Обнаружен тег "${node.name}" вместо ожидаемой директивы данных. Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   private processTagInObjectData(node: Nodes.Tag, context: ITraverseContext): Ast.ContentOptionNode | Ast.OptionNode {
      // TODO: !!!
      if (Resolvers.isOption(node.name)) {
         const optionContext: ITraverseContext = {
            ...context
         };
         return this.processComponentOption(node, optionContext);
      }
      this.errorHandler.error(
         `Обнаружен тег "${node.name}" вместо ожидаемого тега с префиксом ws: в имени, служащий свойством ws:Object`,
         {
            fileName: context.fileName,
            position: node.position
         }
      );
      return null;
   }

   /**
    * Process html element tag and create element node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ElementNode | null} Returns instance of ElementNode or null in case of broken content.
    */
   private processElement(node: Nodes.Tag, context: ITraverseContext): Ast.ElementNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.MARKUP
         };
         const content = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
         const attributes = this.attributeProcessor.process(node.attributes, {
            fileName: context.fileName,
            hasAttributesOnly: true,
            parentTagName: node.name
         });
         return new Ast.ElementNode(node.name, attributes.attributes, attributes.events, content);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора HTML-элемента: ${error.message}. Тег будет отброшен`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   // <editor-fold desc="Processing data type nodes">

   /**
    * Process html element tag and create array node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ArrayNode | null} Returns instance of ArrayNode or null in case of broken content.
    */
   private processArray(node: Nodes.Tag, context: ITraverseContext): Ast.ArrayNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.ARRAY_DATA
         };
         this.warnUnexpectedAttributes(node, context);
         const elements = <Ast.TData[]>this.visitAll(node.children, childrenContext);
         return new Ast.ArrayNode(elements);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Array: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process html element tag and create boolean node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {BooleanNode | null} Returns instance of BooleanNode or null in case of broken content.
    */
   private processBoolean(node: Nodes.Tag, context: ITraverseContext): Ast.BooleanNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.PRIMITIVE_DATA,
            textContent: TextContentFlags.TEXT_AND_EXPRESSION
         };
         this.warnUnexpectedAttributes(node, context);
         const children = <Ast.TextNode[]>this.visitAll(node.children, childrenContext);
         validateBoolean(children);
         return new Ast.BooleanNode(children[0].__$ws_content);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Boolean: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private processFunction(node: Nodes.Tag, context: ITraverseContext): Ast.FunctionNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.PRIMITIVE_DATA,
            textContent: TextContentFlags.TEXT
         };
         const children = this.visitAll(node.children, childrenContext);
         if (children.length !== 1) {
            throw new Error('полученые некорректные данные');
         }
         const textContent = (<Ast.TextNode>children[0]).__$ws_content;
         if (textContent.length !== 1) {
            throw new Error('полученые некорректные данные');
         }
         const text = (<Ast.TextDataNode>textContent[0]).__$ws_content;
         const { physicalPath, logicalPath } = Resolvers.resolveFunction(text);
         const ast = new Ast.FunctionNode(physicalPath, logicalPath);
         const options = this.attributeProcessor.process(
            node.attributes,
            {
               fileName: context.fileName,
               hasAttributesOnly: false,
               parentTagName: node.name
            }
         );
         this.warnIncorrectProperties(options.attributes, node, context);
         this.warnIncorrectProperties(options.events, node, context);
         ast.__ws_options = options.options;
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Function: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process html element tag and create number node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {NumberNode | null} Returns instance of NumberNode or null in case of broken content.
    */
   private processNumber(node: Nodes.Tag, context: ITraverseContext): Ast.NumberNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.PRIMITIVE_DATA,
            textContent: TextContentFlags.TEXT_AND_EXPRESSION
         };
         this.warnUnexpectedAttributes(node, context);
         const children = <Ast.TextNode[]>this.visitAll(node.children, childrenContext);
         validateNumber(children);
         return new Ast.NumberNode(children[0].__$ws_content);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Number: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private prepareObjectProperties(node: Nodes.Tag, context: ITraverseContext): Ast.IObjectProperties {
      const attributes = this.attributeProcessor.process(node.attributes, {
         fileName: context.fileName,
         hasAttributesOnly: false,
         parentTagName: node.name
      });
      this.warnIncorrectProperties(attributes.attributes, node, context);
      this.warnIncorrectProperties(attributes.events, node, context);
      return attributes.options;
   }

   private mergeObjectProperties(source: Ast.Ast[], target: Ast.IObjectProperties, node: Nodes.Tag, context: ITraverseContext): void {
      for (let index = 0; index < source.length; ++index) {
         const child = source[index];
         if (child instanceof Ast.OptionNode || child instanceof Ast.ContentOptionNode) {
            if (target.hasOwnProperty(child.__$ws_name)) {
               this.errorHandler.critical(
                  `Опция "${child.__$ws_name}" уже определена на директиве ws:Object. Полученная опция будет отброшена`,
                  {
                     fileName: context.fileName,
                     position: node.position
                  }
               );
               continue;
            }
            target[child.__$ws_name] = child;
            continue;
         }
         this.errorHandler.critical(
            `Получен некорректный узел (!=Option|ContentOption) внутри компонента "${node.name}"`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
      }
   }

   private processObject(node: Nodes.Tag, context: ITraverseContext): Ast.ObjectNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.OBJECT_DATA
         };
         const children = this.visitAll(node.children, childrenContext);
         const properties = this.prepareObjectProperties(node, context);
         this.mergeObjectProperties(children, properties, node, context);
         return new Ast.ObjectNode(properties);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Object: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   private castAndProcessObjectProperty(node: Nodes.Tag, context: ITraverseContext): Ast.ObjectNode {
      try {
         const properties = { };
         const childrenContext: ITraverseContext = {
            ...context
         };
         const optionName = Resolvers.resolveOption(node.name);
         const content = this.visitAll(node.children, childrenContext);
         if (content.length !== 1) {
            this.errorHandler.critical(
               'Ожидался единственый узел в packAndProcessObjectProperty',
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
         }
         const value = <Ast.TData>content[0];
         if (value.hasFlag(Ast.Flags.TYPE_CASTED) && value instanceof Ast.ObjectNode) {
            for (const attributeName in node.attributes) {
               try {
                  const processedValue = this.textProcessor.process(
                     node.attributes[attributeName].value,
                     {
                        fileName: context.fileName,
                        allowedContent: TextContentFlags.FULL_TEXT
                     },
                     node.attributes[attributeName].position
                  );
                  const valueNode = new Ast.ValueNode(processedValue);
                  value.__$ws_properties[attributeName] = new Ast.OptionNode(
                     attributeName,
                     valueNode
                  );
               } catch (error) {
                  this.errorHandler.error(
                     `Ошибка обработки атрибута "${attributeName}": ${error.message}. Атрибут будет отброшен`,
                     {
                        fileName: context.fileName,
                        position: node.attributes[attributeName].position
                     }
                  );
               }
            }
         } else {
            this.warnUnexpectedAttributes(node, context);
         }
         properties[optionName] = content[0];
         const ast = new Ast.ObjectNode(properties);
         ast.setFlag(Ast.Flags.TYPE_CASTED);
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора опции "${node.name}": ${error.message}. Опция будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process html element tag and create string node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {StringNode | null} Returns instance of StringNode or null in case of broken content.
    */
   private processString(node: Nodes.Tag, context: ITraverseContext): Ast.StringNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.PRIMITIVE_DATA
         };
         this.warnUnexpectedAttributes(node, context);
         const children = <Ast.TText[]>this.visitAll(node.children, childrenContext);
         return new Ast.StringNode(children);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:String: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process html element tag and create value node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ValueNode | null} Returns instance of ValueNode or null in case of broken content.
    */
   private processValue(node: Nodes.Tag, context: ITraverseContext): Ast.ValueNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.PRIMITIVE_DATA
         };
         this.warnUnexpectedAttributes(node, context);
         const children = <Ast.TText[]>this.visitAll(node.children, childrenContext);
         return new Ast.ValueNode(children);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы данных ws:Value: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   // </editor-fold>

   // <editor-fold desc="Processing directive nodes">

   /**
    * Process html element tag and create conditional node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {IfNode | null} Returns instance of IfNode or null in case of broken content.
    */
   private processIf(node: Nodes.Tag, context: ITraverseContext): Ast.IfNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.MARKUP
         };
         const consequent = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
         const test = this.getProgramNodeFromAttribute(node, 'data', context);
         return new Ast.IfNode(test, consequent);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы ws:if: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process html element tag and create conditional node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ElseNode | null} Returns instance of ElseNode or null in case of broken content.
    */
   private processElse(node: Nodes.Tag, context: ITraverseContext): Ast.ElseNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.MARKUP
         };
         const consequent = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
         let test = null;
         if (node.attributes.hasOwnProperty('data')) {
            test = this.getProgramNodeFromAttribute(node, 'data', context);
         }
         validateElseNode(childrenContext.prev);
         return new Ast.ElseNode(consequent, test);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы ws:else: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process html element tag and create cycle node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ForNode | ForeachNode | null} Returns instance of ForNode or ForeachNode or null in case of broken content.
    */
   private processFor(node: Nodes.Tag, context: ITraverseContext): Ast.ForNode | Ast.ForeachNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.MARKUP
         };
         const content = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
         const data = this.getTextFromAttribute(node, 'data', context);
         if (data.indexOf(';') > -1) {
            const { init, test, update } = this.parseForData(data);
            return new Ast.ForNode(init, test, update, content);
         }
         const { index, iterator, collection } = this.parseForeachData(data);
         return new Ast.ForeachNode(index, iterator, collection, content);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы ws:for: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process html element tag and create template node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TemplateNode | null} Returns instance of TemplateNode or null in case of broken content.
    */
   private processTemplate(node: Nodes.Tag, context: ITraverseContext): Ast.TemplateNode {
      try {
         const childrenContext = {
            ...context,
            state: TraverseState.MARKUP
         };
         const content = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
         const name = this.getTextFromAttribute(node, 'name', context);
         Resolvers.resolveInlineTemplate(name);
         const ast = new Ast.TemplateNode(name, content);
         if (content.length === 0) {
            this.errorHandler.error(
               `Содержимое директивы ws:template не должно быть пустым`,
               {
                  fileName: childrenContext.fileName,
                  position: node.position
               }
            );
         }
         context.scope.registerTemplate(name, ast);
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы ws:template: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Parse for-cycle parameters.
    * @private
    * @param data {string} For-cycle parameters.
    * @throws {Error} Throws error if cycle parameters are invalid.
    */
   private parseForData(data: string): { init: ProgramNode | null; test: ProgramNode; update: ProgramNode | null; } {
      const parameters = data.split(';').map(s => s.trim());
      if (parameters.length !== 3) {
         throw new Error(
            `цикл задан некорректно. Ожидалось соответствие шаблону "[init]; test; [update]". Получено: "${data}"`
         );
      }
      try {
         const [initExpression, testExpression, updateExpression] = parameters;
         const init = initExpression ? this.expressionParser.parse(initExpression) : null;
         const test = this.expressionParser.parse(testExpression);
         const update = updateExpression ? this.expressionParser.parse(updateExpression) : null;
         return {
            init,
            test,
            update
         };
      } catch (error) {
         throw new Error(
            `цикл задан некорректно. Ожидалось соответствие шаблону "init; test; update". Получено: "${data}"`
         );
      }
   }

   /**
    * Parse for-cycle parameters.
    * @private
    * @param data {string} For-cycle parameters.
    * @throws {Error} Throws error if cycle parameters are invalid.
    */
   private parseForeachData(data: string): { iterator: ProgramNode; index: ProgramNode | null; collection: ProgramNode; } {
      const params = data.split(' in ');
      if (params.length !== 2) {
         throw new Error(
            `цикл задан некорректно. Ожидалось соответствие шаблону "[index, ] iterator in collection". Получено: "${data}"`
         );
      }
      const [indexIteratorString, collectionExpression] = params;
      const variables = indexIteratorString.split(',').map(s => s.trim());
      if (variables.length < 1 ||variables.length > 2) {
         throw new Error(
            `цикл задан некорректно. Ожидалось соответствие шаблону "[index, ] iterator in collection". Получено: "${data}"`
         );
      }
      try {
         const iteratorExpression = variables.pop();
         const indexExpression = variables.length == 1 ? variables.pop() : null;
         const iterator = this.expressionParser.parse(iteratorExpression);
         const index = indexExpression ? this.expressionParser.parse(indexExpression) : null;
         const collection = this.expressionParser.parse(collectionExpression);
         return {
            iterator,
            index,
            collection
         };
      } catch (error) {
         throw new Error(
            `цикл задан некорректно. Ожидалось соответствие шаблону "[index, ] iterator in collection". Получено: "${data}"`
         );
      }
   }

   // </editor-fold>

   // <editor-fold desc="Processing component nodes">

   /**
    * Process component or partial children and return collection of options.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {Array<ContentOptionNode | OptionNode>} Returns collection of options.
    */
   private processComponentChildren(node: Nodes.Tag, context: ITraverseContext): Array<Ast.ContentOptionNode | Ast.OptionNode> {
      // TODO: ожидаю массив, состоящий:
      //  1) из 1 контентной опции - дочернее состояние COMPONENT_WITH_CONTENT
      //  2) из N опций - дочернее состояние COMPONENT_WITH_OPTION
      const childrenContext: ITraverseContext = {
         ...context,
         state: TraverseState.COMPONENT
      };
      const componentContent = this.visitAll(node.children, childrenContext);
      if (containsContentOnly(componentContent)) {
         return [
            new Ast.ContentOptionNode('content', <Ast.TContent[]>componentContent)
         ];
      }
      return <Array<Ast.OptionNode>>componentContent;
   }

   /**
    * Only process html tag name and attributes and create component node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ComponentNode} Returns instance of ComponentNode.
    * @throws {Error} Throws error in case of broken node data.
    */
   private processComponentHead(node: Nodes.Tag, context: ITraverseContext): Ast.ComponentNode {
      const attributes = this.attributeProcessor.process(node.attributes, {
         fileName: context.fileName,
         hasAttributesOnly: false,
         parentTagName: node.name
      });
      const { physicalPath, logicalPath } = Resolvers.resolveComponent(node.name);
      return new Ast.ComponentNode(
         physicalPath,
         logicalPath,
         attributes.attributes,
         attributes.events,
         attributes.options
      );
   }

   /**
    * Process html element tag and create component node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ComponentNode | null} Returns instance of ForNode or ForeachNode or null in case of broken content.
    */
   private processComponent(node: Nodes.Tag, context: ITraverseContext): Ast.ComponentNode {
      try {
         if (node.isSelfClosing || node.children.length === 0) {
            if (!node.isSelfClosing && node.children.length === 0) {
               this.errorHandler.warn(
                  `Для компонента "${node.name}" не задан контент и тег компонента не указан как самозакрывающийся`,
                  {
                     fileName: context.fileName,
                     position: node.position
                  }
               );
            }
            return this.processComponentHead(node, context);
         }
         const ast = this.processComponentHead(node, context);
         const componentContent = this.processComponentChildren(node, context);
         this.applyOptions(ast, componentContent, node, context);
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора компонента "${node.name}": ${error.message}. Компонент будет отброшен`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Only process html tag name and attributes and create
    * concrete realisation of partial template node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {InlineTemplateNode | StaticPartialNode | DynamicPartialNode} Returns concrete instance of partial template.
    * @throws {Error} Throws error in case of broken node data.
    */
   private processPartialHead(node: Nodes.Tag, context: ITraverseContext): Ast.InlineTemplateNode | Ast.StaticPartialNode | Ast.DynamicPartialNode {
      if (!node.isSelfClosing &&node.children.length === 0) {
         this.errorHandler.warn(
            `Для директивы ws:partial не задан контент и тег компонента не указан как самозакрывающийся`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
      }
      const attributeProcessorOptions = {
         fileName: context.fileName,
         hasAttributesOnly: false,
         parentTagName: node.name
      };
      const attributes = this.attributeProcessor.process(node.attributes, attributeProcessorOptions);
      const template = validatePartialTemplate(attributes.options['template'], node);
      if (template instanceof ProgramNode) {
         return new Ast.DynamicPartialNode(template, attributes.attributes, attributes.events, attributes.options);
      }
      if (Resolvers.isLogicalPath(template) || Resolvers.isPhysicalPath(template)) {
         return new Ast.StaticPartialNode(template, attributes.attributes, attributes.events, attributes.options);
      }
      return new Ast.InlineTemplateNode(template, attributes.attributes, attributes.events, attributes.options);
   }

   /**
    * Process html element tag and create concrete realisation of partial template node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {InlineTemplateNode | StaticPartialNode | DynamicPartialNode | null} Returns concrete instance of partial template or null in case of broken content.
    */
   private processPartial(node: Nodes.Tag, context: ITraverseContext): Ast.InlineTemplateNode | Ast.StaticPartialNode | Ast.DynamicPartialNode {
      try {
         if (node.isSelfClosing || node.children.length === 0) {
            return this.processPartialHead(node, context);
         }
         const ast = this.processPartialHead(node, context);
         const partialContent = this.processComponentChildren(node, context);
         if (containsContentOnly(partialContent)) {
            ast.setOption(new Ast.ContentOptionNode('content', <Ast.TContent[]>partialContent));
            return ast;
         }
         this.applyOptions(ast, partialContent, node, context);
         if (ast instanceof Ast.InlineTemplateNode) {
            context.scope.registerTemplateUsage(ast.__$ws_name);
         }
         return ast;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора директивы ws:partial: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
      }
      return null;
   }

   /**
    * Apply component or partial options.
    * @private
    * @param ast {BaseWasabyElement} Concrete instance of BaseWasabyElement - partial or component.
    * @param children {Array<ContentOptionNode | OptionNode>} Collection of options and content options.
    * @param node {Tag} Source html tag node.
    * @param context {ITraverseContext} Processing context.
    */
   private applyOptions(ast: Ast.BaseWasabyElement, children: Array<Ast.ContentOptionNode | Ast.OptionNode>, node: Nodes.Tag, context: ITraverseContext): void {
      for (let index = 0; index < children.length; ++index) {
         const child = children[index];
         if (child instanceof Ast.OptionNode || child instanceof Ast.ContentOptionNode) {
            if (ast.hasOption(child.__$ws_name)) {
               this.errorHandler.error(
                  `Опция "${child.__$ws_name}" уже определена на теге "${node.name}". Полученная опция будет отброшена`,
                  {
                     fileName: context.fileName,
                     position: node.position
                  }
               );
               continue;
            }
            ast.setOption(child);
            continue;
         }
         // TODO: remove after work
         this.errorHandler.critical(
            `Получен некорректный узел (!=Option|ContentOption) внутри теге "${node.name}"`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
      }
   }

   private processComponentOption(node: Nodes.Tag, context: ITraverseContext): Ast.ContentOptionNode | Ast.OptionNode {
      if (context.state === TraverseState.COMPONENT) {
         context.state = TraverseState.COMPONENT_WITH_OPTION;
      }
      if (context.state !== TraverseState.COMPONENT_WITH_OPTION) {
         this.errorHandler.error(
            `Запрещено смешивать контент по умолчанию с опциями - обнаружена опция "${node.name}". ` +
            'Необходимо явно задать контент в ws:content',
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
      try {
         const optionContext: ITraverseContext = {
            ...context,
            state: TraverseState.COMPONENT_OPTION
         };
         const optionName = Resolvers.resolveOption(node.name);
         if (node.isSelfClosing || node.children.length === 0) {
            const properties = { };
            for (const attributeName in node.attributes) {
               try {
                  const processedValue = this.textProcessor.process(
                     node.attributes[attributeName].value,
                     {
                        fileName: context.fileName,
                        allowedContent: TextContentFlags.FULL_TEXT
                     },
                     node.attributes[attributeName].position
                  );
                  const valueNode = new Ast.ValueNode(processedValue);
                  properties[attributeName] = new Ast.OptionNode(
                     attributeName,
                     valueNode
                  );
               } catch (error) {
                  this.errorHandler.error(
                     `Ошибка обработки опции "${node.name}": ${error.message}. Опция будет отброшен`,
                     {
                        fileName: context.fileName,
                        position: node.attributes[attributeName].position
                     }
                  );
               }
            }
            return new Ast.OptionNode(optionName, new Ast.ObjectNode(properties));
         }
         // результат: контентная опция, узел с данными (возможно type casted)
         const children = this.visitAll(node.children, optionContext);
         if (children.length !== 1) {
            this.errorHandler.error(
               `Содержимое опции "${node.name}" некорректно. Опция будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         }
         const data = children[0];
         if (data instanceof Ast.ContentOptionNode) {
            this.warnUnexpectedAttributes(node, context);
            return new Ast.ContentOptionNode(optionName, <Ast.TContent[]>children);
         }
         if (Ast.isTypeofData(data)) {
            if (data instanceof Ast.ObjectNode) {
               for (const attributeName in node.attributes) {
                  try {
                     const processedValue = this.textProcessor.process(
                        node.attributes[attributeName].value,
                        {
                           fileName: context.fileName,
                           allowedContent: TextContentFlags.FULL_TEXT
                        },
                        node.attributes[attributeName].position
                     );
                     const valueNode = new Ast.ValueNode(processedValue);
                     (<Ast.ObjectNode>data).__$ws_properties[attributeName] = new Ast.OptionNode(
                        attributeName,
                        valueNode
                     );
                  } catch (error) {
                     this.errorHandler.error(
                        `Ошибка обработки опции "${node.name}": ${error.message}. Опция будет отброшен`,
                        {
                           fileName: context.fileName,
                           position: node.attributes[attributeName].position
                        }
                     );
                  }
               }
            }
            return new Ast.OptionNode(optionName, <Ast.TData>data);
         }
         this.errorHandler.critical(
            `Результат разбора опции "${node.name}" - неизвестного типа`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора опции "${node.name}": ${error.message}. Опция будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process component or partial content in context "content only".
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | null} Returns content node or null in case of invalid content.
    */
   private processComponentContent(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
      if (context.state === TraverseState.COMPONENT) {
         context.state = TraverseState.COMPONENT_WITH_CONTENT;
      }
      if (context.state !== TraverseState.COMPONENT_WITH_CONTENT) {
         this.errorHandler.error(
            `Запрещено смешивать контент по умолчанию с опциями - обнаружен тег "${node.name}". Тег будет отброшен. ` +
            'Необходимо явно задать контент в ws:content',
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
      return this.processTagInMarkup(node, context);
   }

   // </editor-fold>

   /**
    * Get program node from tag node attribute value.
    * @private
    * @param node {Tag} Current tag node.
    * @param attribute {string} Name of single required attribute.
    * @param context {ITraverseContext} Processing context.
    * @throws {Error} Throws error if attribute value is invalid.
    */
   private getProgramNodeFromAttribute(node: Nodes.Tag, attribute: string, context: ITraverseContext): ProgramNode {
      const expressionNode = <Ast.ExpressionNode>this.getAttributeValue(node, attribute, TextContentFlags.EXPRESSION, context);
      return expressionNode.__$ws_program;
   }

   /**
    * Get text from tag node attribute value.
    * @private
    * @param node {Tag} Current tag node.
    * @param attribute {string} Name of single required attribute.
    * @param context {ITraverseContext} Processing context.
    * @throws {Error} Throws error if attribute value is invalid.
    */
   private getTextFromAttribute(node: Nodes.Tag, attribute: string, context: ITraverseContext): string {
      const textDataNode = <Ast.TextDataNode>this.getAttributeValue(node, attribute, TextContentFlags.TEXT, context);
      return textDataNode.__$ws_content;
   }

   /**
    * Get tag node attribute value processed.
    * @private
    * @param node {Tag} Current tag node.
    * @param attribute {string} Name of single required attribute.
    * @param allowedContent {TextContentFlags} Allowed attribute value content type.
    * @param context {ITraverseContext} Processing context.
    * @throws {Error} Throws error if attribute value is invalid.
    */
   private getAttributeValue(node: Nodes.Tag, attribute: string, allowedContent: TextContentFlags, context: ITraverseContext): Ast.TText {
      const dataValue = this.attributeProcessor.validateValue(node.attributes, attribute, {
         fileName: context.fileName,
         hasAttributesOnly: true,
         parentTagName: node.name
      });
      const textValue = this.textProcessor.process(
         dataValue,
         {
            fileName: context.fileName,
            allowedContent
         },
         node.position
      );
      return textValue[0];
   }

   /**
    * Remove all unused templates from scope.
    * @private
    * @param context {ITraverseContext} Processing context.
    * @todo Move to scope optimizer.
    */
   private removeUnusedTemplates(context: ITraverseContext): void {
      const templates = context.scope.getTemplateNames();
      for (let index = 0; index < templates.length; ++index) {
         const name = templates[index];
         if (context.scope.getTemplateUsages(name) === 0) {
            this.errorHandler.warn(
               `Шаблон с именем "${name}" определен, но не был использован. Шаблон будет отброшен`,
               {
                  fileName: context.fileName
               }
            );
            context.scope.removeTemplate(name);
         }
      }
   }

   /**
    * Warn all AST attributes in collection as unexpected.
    * @private
    * @param collection {IAttributes | IEvents} Collection of attributes or events.
    * @param parent {Tag} Tag node that contains that collection of attributes or events.
    * @param context {ITraverseContext} Processing context.
    */
   private warnIncorrectProperties(collection: Ast.IAttributes | Ast.IEvents, parent: Nodes.Tag, context: ITraverseContext): void {
      for (const name in collection) {
         this.errorHandler.warn(
            `Обнаружен непредусмотренный атрибут "${name}" на теге "${parent.name}". Атрибут будет отброшен`,
            {
               fileName: context.fileName,
               position: parent.position
            }
         );
      }
   }

   /**
    * Warn all html attributes in html tag node as unexpected.
    * @private
    * @param node {Tag} Tag node that contains collection of attributes.
    * @param context {ITraverseContext} Processing context.
    */
   private warnUnexpectedAttributes(node: Nodes.Tag, context: ITraverseContext): void {
      for (const name in node.attributes) {
         this.errorHandler.warn(
            `Обнаружен непредусмотренный атрибут "${name}" на теге "${node.name}". Атрибут будет отброшен`,
            {
               fileName: context.fileName,
               position: node.attributes[name].position
            }
         );
      }
   }
}
