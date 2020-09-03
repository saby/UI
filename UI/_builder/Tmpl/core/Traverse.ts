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

/**
 * Interface for traverse machine configuration.
 */
export interface ITraverseConfig {

   /**
    * Mustache expression parser.
    */
   expressionParser: IParser;

   /**
    * Flag for generating hierarchical keys on abstract syntax tree nodes.
    */
   hierarchicalKeys: boolean;

   /**
    * Error handler.
    */
   errorHandler: IErrorHandler;

   /**
    * Allow creating comment nodes in abstract syntax tree.
    */
   allowComments: boolean;
}

/**
 * Interface for traverse options.
 */
export interface ITraverseOptions {

   /**
    * Source file name.
    */
   fileName: string;

   /**
    * Processing scope object.
    */
   scope: Scope;
}

/**
 * Interface for traverse machine.
 */
export interface ITraverse extends Nodes.INodeVisitor {

   /**
    * Transform html tree into abstract syntax tree.
    * @param nodes {Node[]} Collection of nodes of html tree.
    * @param options {ITraverseOptions} Transform options.
    * @returns {Ast[]} Collection of nodes of abstract syntax tree.
    */
   transform(nodes: Nodes.Node[], options: ITraverseOptions): Ast.Ast[];
}

/**
 * Transform html tree into abstract syntax tree.
 * @param nodes {Node[]} Collection of nodes of html tree.
 * @param config {ITraverseConfig} Traverse machine configuration.
 * @param options {ITraverseOptions} Traverse machine options.
 * @returns {Ast[]} Collection of nodes of abstract syntax tree.
 */
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
 * Represents shared processing states between sibling nodes.
 */
const enum TraverseState {

   /**
    * In processing html elements and html directives.
    * From this state only one jump is available - to COMPONENT_WITH_UNKNOWN_CONTENT.
    */
   MARKUP,

   /**
    * In processing component or partial that contains either content or options.
    * Processing component or partial is ambiguous. Before processing their children
    * there is no way to know the content type. After processing first child
    * this state will be changed to
    * 1) COMPONENT_WITH_CONTENT - if first child represents node which type is content;
    * 2) COMPONENT_WITH_OPTIONS - if first child represents node which type is option or content option.
    */
   COMPONENT_WITH_UNKNOWN_CONTENT,

   /**
    * In processing component or partial where only content is allowed.
    * All child nodes of component or partial will be processed in markup state.
    * From this state only one implicit jump is available - to MARKUP.
    */
   COMPONENT_WITH_CONTENT,

   /**
    * In processing component or partial where only options are allowed.
    * All child nodes of component will be processed as options.
    * From this state only one implicit jump is available - to MARKUP.
    */
   COMPONENT_WITH_OPTIONS,

   /**
    * In processing array type node where only data types node are allowed.
    * Processing child nodes of array data type node is simple. It only can contain
    * data type nodes which will be packed into array node.
    * From this state next jumps are available:
    * 1) PRIMITIVE_VALUE - if processing node is boolean, function, number, string or value;
    * 2) ARRAY_ELEMENTS - if processing node is array. Again.
    * 3) OBJECT_PROPERTIES - if processing node is object.
    */
   ARRAY_ELEMENTS,

   /**
    * In processing primitive type node content where only text is allowed.
    * In this state only text nodes can be processed. Before processing primitive value content
    * at parent node describes text content using special text content flags.
    * There are no jumps to other states.
    */
   PRIMITIVE_VALUE,

   /**
    * In processing properties of object.
    * In this states only properties can be processed.
    * From this state only one jump is available - to OBJECT_PROPERTY_WITH_UNKNOWN_CONTENT.
    */
   OBJECT_PROPERTIES,

   /**
    * In processing object property content which content is unknown.
    * Processing object property content is ambiguous. Before processing its children
    * there is no way to know the content type. After processing first child
    * this state will be changed to
    * 1) OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_OBJECT - if first child represents another option;
    * 2) OBJECT_PROPERTY_WITH_CONTENT - if first child represents node which type is content;
    * 3) OBJECT_PROPERTY_WITH_DATA_TYPE - if first child represents data type node.
    */
   OBJECT_PROPERTY_WITH_UNKNOWN_CONTENT,

   /**
    * In processing object property that contain other object properties.
    * In this case other properties will be packed into options or content options,
    * these options will be packed into object, and this object will be a value of processing object property.
    */
   OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_OBJECT,

   /**
    * In processing object property that contain content nodes only.
    * From this state only one implicit jump is available - to MARKUP.
    */
   OBJECT_PROPERTY_WITH_CONTENT,

   /**
    * In processing object property that contain content nodes only.
    */
   OBJECT_PROPERTY_WITH_DATA_TYPE
}

/**
 * Traverse context.
 */
interface ITraverseContext extends ITraverseOptions {

   /**
    * Previous processed node of abstract syntax tree.
    */
   prev: Ast.Ast | null;

   /**
    * Current traverse machine state.
    */
   state: TraverseState;

   /**
    * Allowed text content data.
    */
   textContent: TextContentFlags;
}

/**
 * Validate conditional else node.
 * @param prev {Ast} Previous processed node of abstract syntax tree.
 * @throws {Error} Throws Error in case of invalid conditional else semantics.
 */
function validateElseNode(prev: Ast.Ast | null): void {
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

/**
 * Validate processed boolean node content.
 * @param children {TextNode[]} Processed boolean node content.
 * @throws {Error} Throws Error in case of invalid boolean semantics.
 */
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

/**
 * Validate processed number node content.
 * @param children {TextNode[]} Processed number node content.
 * @throws {Error} Throws Error in case of invalid number semantics.
 */
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

/**
 * Validate processed option "template" for partial node and get its clean value.
 * @param option {OptionNode} Processed option "template" for partial node.
 * @param node {Tag} Origin node of html tree.
 * @returns {ProgramNode | string} Returns string or instance of ProgramNode in case of dynamic partial.
 * @throws {Error} Throws Error in case of invalid semantics template name of partial node.
 */
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

/**
 * Check if first child in type consistent collection has type of content.
 * @param children {Ast[]} Type consistent collection of nodes of abstract syntax tree.
 */
function isFirstChildContent(children: Ast.Ast[]): boolean {
   if (children.length === 0) {
      return false;
   }
   return Ast.isTypeofContent(children[0]);
}

/**
 * Allowed type names for type casting.
 */
const CASTING_TYPES = {
   'array': true,
   'boolean': true,
   'function': true,
   'number': true,
   'object': true,
   'string': true,
   'value': true
};

/**
 * Check if html tag node (processing in context of property) has "type" attribute
 * and its value is valid and allowed in casting types collection.
 * @param node {Tag} Processing html tag node in context of property.
 * @returns {boolean} Returns true if property tag can be type casted.
 */
function canBeTypeCasted(node: Nodes.Tag): boolean {
   if (!node.attributes.hasOwnProperty('type')) {
      return false;
   }
   const type = node.attributes.type.value;
   return !!CASTING_TYPES[type];
}

/**
 * Check special unknown states to content state.
 * @param context {ITraverseContext} Processing context.
 */
function updateToContentState(context: ITraverseContext): void {
   switch (context.state) {
      case TraverseState.COMPONENT_WITH_UNKNOWN_CONTENT:
         context.state = TraverseState.COMPONENT_WITH_CONTENT;
         break;
      case TraverseState.OBJECT_PROPERTY_WITH_UNKNOWN_CONTENT:
         context.state = TraverseState.OBJECT_PROPERTY_WITH_CONTENT;
         break;
   }
}

// </editor-fold>

/**
 * Represents traverse finite state machine.
 */
class Traverse implements ITraverse {

   // <editor-fold desc="Traverse properties">

   /**
    * Mustache expression parser.
    */
   private readonly expressionParser: IParser;

   /**
    * Keys generator for nodes of abstract syntax tree.
    */
   private readonly keysGenerator: IKeysGenerator;

   /**
    * Error handler.
    */
   private readonly errorHandler: IErrorHandler;

   /**
    * Allow creating comment nodes in abstract syntax tree.
    */
   private readonly allowComments: boolean;

   /**
    * Attribute processor.
    */
   private readonly attributeProcessor: IAttributeProcessor;

   /**
    * Text processor.
    */
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
         scope: options.scope,
         textContent: TextContentFlags.FULL_TEXT
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
      updateToContentState(context);
      switch (context.state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT_WITH_CONTENT:
         case TraverseState.OBJECT_PROPERTY_WITH_CONTENT:
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
      updateToContentState(context);
      switch (context.state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT_WITH_CONTENT:
         case TraverseState.OBJECT_PROPERTY_WITH_CONTENT:
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
      updateToContentState(context);
      switch (context.state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT_WITH_CONTENT:
         case TraverseState.OBJECT_PROPERTY_WITH_CONTENT:
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
      updateToContentState(context);
      switch (context.state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT_WITH_CONTENT:
         case TraverseState.OBJECT_PROPERTY_WITH_CONTENT:
         case TraverseState.PRIMITIVE_VALUE:
            return this.processText(node, context);
         default:
            this.errorHandler.error(
               'Использование текста запрещено в данном контексте',
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
      switch (context.state) {
         case TraverseState.MARKUP:
            return this.processTagInMarkup(node, context);
         case TraverseState.COMPONENT_WITH_UNKNOWN_CONTENT:
            return this.processTagInComponentWithUnknownContent(node, context);
         case TraverseState.COMPONENT_WITH_CONTENT:
            return this.processTagInComponentWithContent(node, context);
         case TraverseState.COMPONENT_WITH_OPTIONS:
            return this.processTagInComponentWithOptions(node, context);
         case TraverseState.ARRAY_ELEMENTS:
            return this.processTagInArrayData(node, context);
         case TraverseState.OBJECT_PROPERTIES:
            return this.processTagInObjectProperties(node, context);
         case TraverseState.OBJECT_PROPERTY_WITH_UNKNOWN_CONTENT:
            return this.processTagInObjectPropertyWithUnknownContent(node, context);
         case TraverseState.OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_OBJECT:
            return this.processTagInObjectPropertyWithContentTypeCastedToObject(node, context);
         case TraverseState.OBJECT_PROPERTY_WITH_CONTENT:
            return this.processTagInObjectPropertyWithContent(node, context);
         case TraverseState.OBJECT_PROPERTY_WITH_DATA_TYPE:
            return this.processTagInObjectPropertyWithDataType(node, context);
         case TraverseState.PRIMITIVE_VALUE:
            this.errorHandler.error(
               `Обнаружен тег "${node.name}", когда ожидалось текстовое содержимое. Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         default:
            this.errorHandler.critical(
               'Конечный автомат traverse находится в неизвестном состоянии',
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   // </editor-fold>

   /**
    * Process html tag node in state of markup.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {Ast | null} Returns instance of concrete TContent or null in case of broken content.
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
            return this.checkDirectiveInAttribute(node, context);
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
            return this.checkDirectiveInAttribute(node, context);
      }
   }

   /**
    * Process html tag node in state of array elements.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TData | null} Returns instance of concrete TData or null in case of broken content.
    */
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

   /**
    * Process html tag node in state of component with any type of content.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | ContentOptionNode | OptionNode | null} Returns instance of concrete TContent or null in case of broken content.
    */
   private processTagInComponentWithUnknownContent(node: Nodes.Tag, context: ITraverseContext): Ast.TContent | Ast.ContentOptionNode | Ast.OptionNode {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:partial':
            return this.processTagInComponentWithContent(node, context);
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
               return this.processTagInComponentWithOptions(node, context);
            }
            return this.processTagInComponentWithContent(node, context);
      }
   }

   /**
    * Process html tag node in state of component content with content.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | null} Returns instance of concrete TContent or null in case of broken content.
    */
   private processTagInComponentWithContent(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
      updateToContentState(context);
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

   /**
    * Process html tag node in state of component content with options.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ContentOptionNode | OptionNode | null} Returns ContentOptionNode or OptionNode or null in case of broken content.
    */
   private processTagInComponentWithOptions(node: Nodes.Tag, context: ITraverseContext): Ast.ContentOptionNode | Ast.OptionNode {
      if (context.state === TraverseState.COMPONENT_WITH_UNKNOWN_CONTENT) {
         context.state = TraverseState.COMPONENT_WITH_OPTIONS;
      }
      if (context.state !== TraverseState.COMPONENT_WITH_OPTIONS) {
         this.errorHandler.error(
            `Запрещено смешивать контент по умолчанию с опциями - обнаружена опция "${node.name}". Опция будет отброшен. ` +
            'Необходимо явно задать контент в ws:content',
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
      return this.processProperty(node, context);
   }

   /**
    * Process html tag node in state of object properties.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ContentOptionNode | OptionNode | null} Returns ContentOptionNode or OptionNode or null in case of broken content.
    */
   private processTagInObjectProperties(node: Nodes.Tag, context: ITraverseContext): Ast.ContentOptionNode | Ast.OptionNode {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:partial':
            this.errorHandler.error(
               `Использование директивы "${node.name}" внутри директивы "ws:Object" запрещено. Ожидалась опция объекта. Директива будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
            this.errorHandler.error(
               `Использование директивы "${node.name}" вне описания опции запрещено. Ожидалась опция объекта. Директива будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         default:
            if (Resolvers.isOption(node.name)) {
               return this.processProperty(node, context);
            }
            this.errorHandler.error(
               `Обнаружен тег "${node.name}" вместо ожидаемой опции объекта. Тег будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
   }

   /**
    * Process content node of property.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | TData | OptionNode | null} Returns node type of TContent, TData, OptionNode or null in case of broken content.
    */
   private processTagInObjectPropertyWithUnknownContent(node: Nodes.Tag, context: ITraverseContext): Ast.TContent | Ast.TData | Ast.OptionNode {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:partial':
            return this.processTagInObjectPropertyWithContent(node, context);
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
            return this.processTagInObjectPropertyWithDataType(node, context);
         default:
            if (Resolvers.isOption(node.name)) {
               return this.processTagInObjectPropertyWithContentTypeCastedToObject(node, context);
            }
            return this.processTagInObjectPropertyWithContent(node, context);
      }
   }

   /**
    * Process content of property node.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | null} Returns node type of TContent or null in case of broken content.
    */
   private processTagInObjectPropertyWithContent(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
      updateToContentState(context);
      if (context.state !== TraverseState.OBJECT_PROPERTY_WITH_CONTENT) {
         this.errorHandler.error(
            `Запрещено смешивать контент, директивы типов данных и опции. Обнаружен тег "${node.name}". Ожидался тег контента. Тег будет отброшен.`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
      return this.processTagInMarkup(node, context);
   }

   /**
    * Process data content of property node.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TData | null} Returns instance of concrete TData or null in case of broken content.
    */
   private processTagInObjectPropertyWithDataType(node: Nodes.Tag, context: ITraverseContext): Ast.TData {
      if (context.state === TraverseState.OBJECT_PROPERTY_WITH_DATA_TYPE) {
         this.errorHandler.error(
            `Опция компонента, ws:partial и объекта может содержать только 1 директиву типа данных. Обнаружен тег "${node.name}". Тег будет отброшен.`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
      if (context.state === TraverseState.OBJECT_PROPERTY_WITH_UNKNOWN_CONTENT) {
         context.state = TraverseState.OBJECT_PROPERTY_WITH_DATA_TYPE;
      }
      if (context.state !== TraverseState.OBJECT_PROPERTY_WITH_DATA_TYPE) {
         this.errorHandler.error(
            `Запрещено смешивать контент, директивы типов данных и опции. Обнаружен тег "${node.name}". Ожидалась. Тег будет отброшен.`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
      return this.processTagInArrayData(node, context);
   }

   /**
    * Process property of property with casting the current to object type.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {OptionNode | ContentOptionNode} Returns OptionNode, ContentOptionNode or null in case of broken content.
    */
   private processTagInObjectPropertyWithContentTypeCastedToObject(node: Nodes.Tag, context: ITraverseContext): Ast.OptionNode | Ast.ContentOptionNode {
      if (context.state === TraverseState.OBJECT_PROPERTY_WITH_UNKNOWN_CONTENT) {
         context.state = TraverseState.OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_OBJECT;
      }
      if (context.state !== TraverseState.OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_OBJECT) {
         this.errorHandler.error(
            `Запрещено смешивать контент, директивы типов данных и опции. Обнаружен тег "${node.name}". Ожидалась. Тег будет отброшен.`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
      return this.processProperty(node, context);
   }

   /**
    * Check directive in attribute and try to unpack node.
    * @private
    * @todo Do real unpacking when compiler codegen stage will be ready. Do unpacking also for "if"-directive
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | null} Returns node type of TContent or null in case of broken content.
    */
   private checkDirectiveInAttribute(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
      if (node.attributes.hasOwnProperty('for')) {
         return this.unpackForDirective(node, context);
      }
      return this.processContentTagWithoutUnpacking(node, context);
   }

   /**
    * Unpack for directive from attribute of content type html tag node.
    * @private
    * @todo Do real unpacking when compiler codegen stage will be ready
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | null} Returns node type of TContent or null in case of broken content.
    */
   private unpackForDirective(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
      const forAttribute = node.attributes.for;
      // FIXME: Don't modify source html tree
      delete node.attributes.for;
      const ast = this.processContentTagWithoutUnpacking(node, context);
      if (ast === null) {
         return ast;
      }
      if (!(ast instanceof Ast.ElementNode)) {
         this.errorHandler.error(
            `Обнаружен цикл "for" в атрибутах тега "${node.name}". Цикл на данном теге не поддерживается. Атрибут будет отброшен`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return ast;
      }
      ast.__$ws_unpackedCycle = this.processForAttribute(node, context, forAttribute);
      return ast;
   }

   /**
    * Process "for" attribute value.
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attribute {Attribute} "for" attribute.
    */
   private processForAttribute(node: Nodes.Tag, context: ITraverseContext, attribute: Nodes.Attribute): Ast.ForNode | Ast.ForeachNode {
      try {
         if (attribute.value === null) {
            throw new Error('не заданы параметры цикла');
         }
         const textValue = this.textProcessor.process(
            attribute.value,
            {
               fileName: context.fileName,
               allowedContent: TextContentFlags.TEXT
            },
            node.position
         );
         if (textValue.length !== 1) {
            throw new Error('не удалось извлечь параметры цикла');
         }
         const cycleData = (<Ast.TextDataNode>textValue[0]).__$ws_content;
         if (cycleData.indexOf(';')) {
            const { init, test, update } = this.parseForParameters(cycleData);
            return new Ast.ForNode(init, test, update, []);

         }
         const { index, iterator, collection } = this.parseForeachParameters(cycleData);
         return new Ast.ForeachNode(index, iterator, collection, []);
      } catch (error) {
         this.errorHandler.critical(
            `Ошибка обработки директивы "for" на атрибуте тега ${node.name}: ${error.message}. Директива будет отброшена`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Continue processing html tag node as content type node.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | null} Returns node type of TContent or null in case of broken content.
    */
   private processContentTagWithoutUnpacking(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
      if (node.name == 'ws:partial') {
         return this.processPartial(node, context);
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

   /**
    * Process property of "complex" object - component, partial or object.
    * If property contains "type" attribute then property content will be type casted.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ContentOptionNode | OptionNode | null} Returns ContentOptionNode or OptionNode or null in case of broken content.
    */
   private processProperty(node: Nodes.Tag, context: ITraverseContext): Ast.OptionNode | Ast.ContentOptionNode {
      if (canBeTypeCasted(node)) {
         return this.castPropertyWithType(node, context);
      }
      const propertyContext: ITraverseContext = {
         ...context,
         state: TraverseState.OBJECT_PROPERTY_WITH_UNKNOWN_CONTENT
      };
      const content = this.visitAll(node.children, propertyContext);
      const name = Resolvers.resolveOption(node.name);
      if (isFirstChildContent(content)) {
         return new Ast.ContentOptionNode(
            name,
            <Ast.TContent[]>content
         );
      }
      if (content.length === 1 && Ast.isTypeofData(content[0])) {
         return new Ast.OptionNode(
            name,
            <Ast.TData>content[0]
         );
      }
      const properties = this.getObjectOptionsFromAttributes(node.attributes, context, node);
      for (let index = 0; index < content.length; ++index) {
         const property = content[index];
         if (!(property instanceof Ast.OptionNode || property instanceof Ast.ContentOptionNode)) {
            this.errorHandler.critical(
               `Результат обработки опции "${node.name}" был получен некорректный узел. Узел будет отброшен`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            continue;
         }
         if (properties.hasOwnProperty(property.__$ws_name)) {
            this.errorHandler.critical(
               `Опция "${property.__$ws_name}" уже существует на объекте "${node.name}". Опция будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            continue;
         }
         properties[property.__$ws_name] = property;
      }
      return new Ast.OptionNode(
         name,
         new Ast.ObjectNode(properties)
      );
   }

   /**
    * Process html text node.
    * @private
    * @param node {Text} Html text node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TextNode | null} Returns instance of TextNode or null in case of broken content.
    */
   private processText(node: Nodes.Text, context: ITraverseContext): Ast.TextNode {
      try {
         updateToContentState(context);
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

   // <editor-fold desc="Properties type casting">

   /**
    * Process property and cast its content to concrete type.
    * ```
    *    <ws:property type="array|boolean|function|number|object|string|value">
    *       ...
    *    </ws:property>
    * ```
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {OptionNode} Returns option node that contains value with concrete type.
    */
   private castPropertyWithType(node: Nodes.Tag, context: ITraverseContext): Ast.OptionNode {
      const type = node.attributes.type.value;
      const attributes: Nodes.IAttributes = {
         ...node.attributes
      };
      delete attributes.type;
      switch (type) {
         case 'array':
            return this.castPropertyContentToArray(node, context, attributes);
         case 'boolean':
            return this.castPropertyContentToBoolean(node, context, attributes);
         case 'function':
            return this.castPropertyContentToFunction(node, context, attributes);
         case 'number':
            return this.castPropertyContentToNumber(node, context, attributes);
         case 'object':
            return this.castPropertyContentToObject(node, context, attributes);
         case 'string':
            return this.castPropertyContentToString(node, context, attributes);
         case 'value':
            return this.castPropertyContentToValue(node, context, attributes);
      }
      this.errorHandler.critical(
         `Не удалось определить тип опции ${node.name} для выполнения приведения. Опция будет отброшена`,
         {
            fileName: context.fileName,
            position: node.position
         }
      );
      return null;
   }

   /**
    * Process property and cast its content to array type.
    * ```
    *    <ws:property type="array">
    *       ...
    *       <ws:Type>
    *          ...
    *       </ws:Type>
    *       ...
    *    </ws:property>
    * ```
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Attributes collection with removed "type" property.
    * Attributes collection on html tag node will be ignored.
    * @returns {OptionNode} Returns option node that contains value with type of array.
    */
   private castPropertyContentToArray(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.OptionNode {
      try {
         const name = Resolvers.resolveOption(node.name);
         const elements = new Ast.ArrayNode(
            this.processArrayContent(node, context, attributes)
         );
         elements.setFlag(Ast.Flags.TYPE_CASTED);
         return new Ast.OptionNode(name, elements);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка обработки свойства "${node.name}" с заданным типом "array": ${error.message}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process property and cast its content to array type.
    * ```
    *    <ws:property type="boolean">
    *       Mustache-expression or text with values "true" or "false".
    *    </ws:property>
    * ```
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Attributes collection with removed "type" property.
    * Attributes collection on html tag node will be ignored.
    * @returns {OptionNode} Returns option node that contains value with type of value.
    */
   private castPropertyContentToBoolean(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.OptionNode {
      try {
         const name = Resolvers.resolveOption(node.name);
         const value = new Ast.BooleanNode(
            this.processBooleanContent(node, context, attributes)
         );
         value.setFlag(Ast.Flags.TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка обработки свойства "${node.name}" с заданным типом "boolean": ${error.message}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process property and cast its content to function type.
    * ```
    *    <ws:property type="function">
    *       Text with correct path to function
    *    </ws:property>
    * ```
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Attributes collection with removed "type" property.
    * Attributes collection on html tag node will be ignored.
    * @returns {OptionNode} Returns option node that contains value with type of function.
    */
   private castPropertyContentToFunction(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.OptionNode {
      try {
         const { physicalPath, logicalPath, options } = this.processFunctionContent(node, context, attributes);
         const name = Resolvers.resolveOption(node.name);
         const value = new Ast.FunctionNode(physicalPath, logicalPath, options);
         value.setFlag(Ast.Flags.TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка обработки свойства "${node.name}" с заданным типом "function": ${error.message}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process property and cast its content to number type.
    * ```
    *    <ws:property type="number">
    *       Mustache-expression or text with valid number value.
    *    </ws:property>
    * ```
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Attributes collection with removed "type" property.
    * Attributes collection on html tag node will be ignored.
    * @returns {OptionNode} Returns option node that contains value with type of number.
    */
   private castPropertyContentToNumber(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.OptionNode {
      try {
         const name = Resolvers.resolveOption(node.name);
         const value = new Ast.NumberNode(
            this.processNumberContent(node, context, attributes)
         );
         value.setFlag(Ast.Flags.TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка обработки свойства "${node.name}" с заданным типом "number": ${error.message}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process property and cast its content to object type.
    * ```
    *    <ws:property type="object">
    *       ...
    *       <ws:property>
    *          ...
    *       </ws:property>
    *       ...
    *    </ws:property>
    * ```
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Attributes collection with removed "type" property.
    * Attributes collection on html tag node will be ignored.
    * @returns {OptionNode} Returns option node that contains value with type of object.
    */
   private castPropertyContentToObject(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.OptionNode {
      try {
         const name = Resolvers.resolveOption(node.name);
         const value = new Ast.ObjectNode(
            this.processObjectContent(node, context, attributes)
         );
         value.setFlag(Ast.Flags.TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка обработки свойства "${node.name}" с заданным типом "object": ${error.message}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process property and cast its content to string type.
    * ```
    *    <ws:property type="string">
    *       Mustache-expression, text or translation.
    *    </ws:property>
    * ```
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Attributes collection with removed "type" property.
    * Attributes collection on html tag node will be ignored.
    * @returns {OptionNode} Returns option node that contains value with type of string.
    */
   private castPropertyContentToString(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.OptionNode {
      try {
         const name = Resolvers.resolveOption(node.name);
         const value = new Ast.StringNode(
            this.processStringContent(node, context, attributes)
         );
         value.setFlag(Ast.Flags.TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка обработки свойства "${node.name}" с заданным типом "string": ${error.message}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process property and cast its content to value type.
    * ```
    *    <ws:property type="value">
    *       Mustache-expression, translation or text
    *    </ws:property>
    * ```
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Attributes collection with removed "type" property.
    * Attributes collection on html tag node will be ignored.
    * @returns {OptionNode} Returns option node that contains value with type of value.
    */
   private castPropertyContentToValue(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.OptionNode {
      try {
         const name = Resolvers.resolveOption(node.name);
         const value = new Ast.ValueNode(
            this.processValueContent(node, context, attributes)
         );
         value.setFlag(Ast.Flags.TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка обработки свойства "${node.name}" с заданным типом "value": ${error.message}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   // </editor-fold>

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
    * ```
    *    <ws:Array>
    *       ...
    *       <ws:Type>
    *          ...
    *       </ws:Type>
    *       ...
    *    </ws:Array>
    * ```
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ArrayNode | null} Returns instance of ArrayNode or null in case of broken content.
    */
   private processArray(node: Nodes.Tag, context: ITraverseContext): Ast.ArrayNode {
      try {
         return new Ast.ArrayNode(
            this.processArrayContent(node, context, node.attributes)
         );
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
    * Process content of array node. Requirements to content:
    * it can contain only data type nodes.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Preprocessed collection of html tag node attributes.
    * Attributes collection on html tag node will be ignored.
    * @returns {TData[]} Returns consistent collection of data type nodes.
    */
   private processArrayContent(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.TData[] {
      const childrenContext = {
         ...context,
         state: TraverseState.ARRAY_ELEMENTS
      };
      this.warnUnexpectedAttributes(attributes, context, node.name);
      return <Ast.TData[]>this.visitAll(node.children, childrenContext);
   }

   /**
    * Process html element tag and create boolean node of abstract syntax tree.
    * ```
    *    <ws:Boolean>
    *       Mustache-expression or text with values "true" or "false".
    *    </ws:Boolean>
    * ```
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {BooleanNode | null} Returns instance of BooleanNode or null in case of broken content.
    */
   private processBoolean(node: Nodes.Tag, context: ITraverseContext): Ast.BooleanNode {
      try {
         return new Ast.BooleanNode(
            this.processBooleanContent(node, context, node.attributes)
         );
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

   /**
    * Process content of boolean node. Requirements to content:
    * it can contain Mustache-expression or text with values "true" or "false".
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Preprocessed collection of html tag node attributes.
    * Attributes collection on html tag node will be ignored.
    * @returns {TText[]} Returns consistent collection of text nodes.
    */
   private processBooleanContent(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.TText[] {
      const childrenContext = {
         ...context,
         state: TraverseState.PRIMITIVE_VALUE,
         textContent: TextContentFlags.TEXT_AND_EXPRESSION
      };
      this.warnUnexpectedAttributes(attributes, context, node.name);
      const children = <Ast.TextNode[]>this.visitAll(node.children, childrenContext);
      validateBoolean(children);
      return children[0].__$ws_content;
   }

   /**
    * Process html element tag and create function node of abstract syntax tree.
    * ```
    *    <ws:Function>
    *       Text with correct path to function
    *    </ws:Function>
    * ```
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {FunctionNode | null} Returns instance of FunctionNode or null in case of broken content.
    */
   private processFunction(node: Nodes.Tag, context: ITraverseContext): Ast.FunctionNode {
      try {
         const { physicalPath, logicalPath, options } = this.processFunctionContent(node, context, node.attributes);
         return new Ast.FunctionNode(physicalPath, logicalPath, options);
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
    * Process content of function node. Requirements to content:
    * it can contain text with correct path to function.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Preprocessed collection of html tag node attributes.
    * Attributes collection on html tag node will be ignored.
    * @returns {*} Returns collection of function parameters.
    */
   private processFunctionContent(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): { physicalPath: string[]; logicalPath: string[]; options: Ast.IOptions; } {
      const childrenContext = {
         ...context,
         state: TraverseState.PRIMITIVE_VALUE,
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
      const { physicalPath, logicalPath } = Resolvers.parseFunctionPath(text);
      const options = this.attributeProcessor.process(
         attributes,
         {
            fileName: context.fileName,
            hasAttributesOnly: false,
            parentTagName: node.name
         }
      );
      this.warnIncorrectProperties(options.attributes, node, context);
      this.warnIncorrectProperties(options.events, node, context);
      return {
         physicalPath,
         logicalPath,
         options: options.options
      };
   }

   /**
    * Process html element tag and create number node of abstract syntax tree.
    * ```
    *    <ws:Number>
    *       Mustache-expression or text with valid number value.
    *    </ws:Number>
    * ```
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {NumberNode | null} Returns instance of NumberNode or null in case of broken content.
    */
   private processNumber(node: Nodes.Tag, context: ITraverseContext): Ast.NumberNode {
      try {
         return new Ast.NumberNode(
            this.processNumberContent(node, context, node.attributes)
         );
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

   /**
    * Process content of number node. Requirements to content:
    * it can contain Mustache-expression or text with valid number value.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Preprocessed collection of html tag node attributes.
    * Attributes collection on html tag node will be ignored.
    * @returns {TText[]} Returns consistent collection of text nodes.
    */
   private processNumberContent(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.TText[] {
      const childrenContext = {
         ...context,
         state: TraverseState.PRIMITIVE_VALUE,
         textContent: TextContentFlags.TEXT_AND_EXPRESSION
      };
      this.warnUnexpectedAttributes(attributes, context, node.name);
      const children = <Ast.TextNode[]>this.visitAll(node.children, childrenContext);
      validateNumber(children);
      return children[0].__$ws_content;
   }

   /**
    * Process html element tag and create object node of abstract syntax tree.
    * ```
    *    <ws:Object>
    *       ...
    *       <ws:property>
    *          ...
    *       </ws:property>
    *       ...
    *    </ws:Object>
    * ```
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ObjectNode | null} Returns instance of ObjectNode or null in case of broken content.
    */
   private processObject(node: Nodes.Tag, context: ITraverseContext): Ast.ObjectNode {
      try {
         return new Ast.ObjectNode(
            this.processObjectContent(node, context, node.attributes)
         );
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

   /**
    * Process content of object node. Requirements to content:
    * it can contain only tag nodes and their names starts with "ws:" prefix.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Preprocessed collection of html tag node attributes.
    * Attributes collection on html tag node will be ignored.
    * @returns {IObjectProperties} Returns collection of properties nodes.
    */
   private processObjectContent(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.IObjectProperties {
      const propertiesContext: ITraverseContext = {
         ...context,
         state: TraverseState.OBJECT_PROPERTIES
      };
      const processedChildren = this.visitAll(node.children, propertiesContext);
      const properties = this.getObjectOptionsFromAttributes(attributes, context, node);
      for (let index = 0; index < processedChildren.length; ++index) {
         const child = processedChildren[index];
         if (!(child instanceof Ast.OptionNode || child instanceof Ast.ContentOptionNode)) {
            this.errorHandler.critical(
               `Получен некорректный узел (!=Option|ContentOption) внутри компонента "${node.name}"`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            continue;
         }
         if (properties.hasOwnProperty(child.__$ws_name)) {
            this.errorHandler.critical(
               `Опция "${child.__$ws_name}" уже определена на директиве "ws:Object". Полученная опция будет отброшена`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            continue;
         }
         properties[child.__$ws_name] = child;
      }
      return properties;
   }

   /**
    * Process html element tag and create string node of abstract syntax tree.
    * ```
    *    <ws:String>
    *       Mustache-expression, text or translation.
    *    </ws:String>
    * ```
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {StringNode | null} Returns instance of StringNode or null in case of broken content.
    */
   private processString(node: Nodes.Tag, context: ITraverseContext): Ast.StringNode {
      try {
         return new Ast.StringNode(
            this.processStringContent(node, context, node.attributes)
         );
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
    * Process content of string node. Requirements to content:
    * it can contain Mustache-expression, translation or text.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Preprocessed collection of html tag node attributes.
    * Attributes collection on html tag node will be ignored.
    * @returns {TText[]} Returns consistent collection of text nodes.
    */
   private processStringContent(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.TText[] {
      const childrenContext = {
         ...context,
         state: TraverseState.PRIMITIVE_VALUE
      };
      this.warnUnexpectedAttributes(attributes, context, node.name);
      return <Ast.TText[]>this.visitAll(node.children, childrenContext);
   }

   /**
    * Process html element tag and create value node of abstract syntax tree.
    * ```
    *    <ws:Value>
    *       Mustache-expression, translation or text
    *    </ws:Value>
    * ```
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ValueNode | null} Returns instance of ValueNode or null in case of broken content.
    */
   private processValue(node: Nodes.Tag, context: ITraverseContext): Ast.ValueNode {
      try {
         return new Ast.ValueNode(
            this.processValueContent(node, context, node.attributes)
         );
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

   /**
    * Process content of value node. Requirements to content:
    * it can contain Mustache-expression, translation or text.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attributes {IAttributes} Preprocessed collection of html tag node attributes.
    * Attributes collection on html tag node will be ignored.
    * @returns {TText[]} Returns consistent collection of text nodes.
    */
   private processValueContent(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): Ast.TText[] {
      const childrenContext = {
         ...context,
         state: TraverseState.PRIMITIVE_VALUE
      };
      this.warnUnexpectedAttributes(attributes, context, node.name);
      return <Ast.TText[]>this.visitAll(node.children, childrenContext);
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
            const { init, test, update } = this.parseForParameters(data);
            return new Ast.ForNode(init, test, update, content);
         }
         const { index, iterator, collection } = this.parseForeachParameters(data);
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
         Resolvers.validateInlineTemplate(name);
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
   private parseForParameters(data: string): { init: ProgramNode | null; test: ProgramNode; update: ProgramNode | null; } {
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
   private parseForeachParameters(data: string): { iterator: ProgramNode; index: ProgramNode | null; collection: ProgramNode; } {
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
    * Process html element tag and create component node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ComponentNode | null} Returns instance of ComponentNode null in case of broken content.
    */
   private processComponent(node: Nodes.Tag, context: ITraverseContext): Ast.ComponentNode {
      try {
         if (node.children.length === 0) {
            return this.processComponentWithNoChildren(node, context);
         }
         return this.processComponentWithChildren(node, context);
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
    * Process html element tag with no children and create component node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ComponentNode | null} Returns instance of ComponentNode null in case of broken content.
    */
   private processComponentWithNoChildren(node: Nodes.Tag, context: ITraverseContext): Ast.ComponentNode {
      if (!node.isSelfClosing) {
         this.errorHandler.warn(
            `Для компонента "${node.name}" не задан контент и тег компонента не указан как самозакрывающийся`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
      }
      return this.createComponentOnly(node, context);
   }

   /**
    * Process component node with its content.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ComponentNode} Returns component node of abstract syntax tree.
    */
   private processComponentWithChildren(node: Nodes.Tag, context: ITraverseContext): Ast.ComponentNode {
      const options = this.getComponentOrPartialOptions(node.children, context);
      const ast = this.createComponentOnly(node, context);
      this.applyOptionsToComponentOrPartial(ast, options, context, node);
      return ast;
   }

   /**
    * Only process html tag name and attributes and create component node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {ComponentNode} Returns instance of ComponentNode.
    * @throws {Error} Throws error in case of broken node data.
    */
   private createComponentOnly(node: Nodes.Tag, context: ITraverseContext): Ast.ComponentNode {
      const attributes = this.attributeProcessor.process(node.attributes, {
         fileName: context.fileName,
         hasAttributesOnly: false,
         parentTagName: node.name
      });
      const { physicalPath, logicalPath } = Resolvers.parseComponentPath(node.name);
      return new Ast.ComponentNode(
         physicalPath,
         logicalPath,
         attributes.attributes,
         attributes.events,
         attributes.options
      );
   }

   // </editor-fold>

   // <editor-fold desc="Processing partial nodes">

   /**
    * Process html element tag and create concrete realisation of partial template node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {InlineTemplateNode | StaticPartialNode | DynamicPartialNode | null} Returns concrete instance of partial template or null in case of broken content.
    */
   private processPartial(node: Nodes.Tag, context: ITraverseContext): Ast.InlineTemplateNode | Ast.StaticPartialNode | Ast.DynamicPartialNode {
      try {
         if (node.children.length === 0) {
            return this.processPartialWithNoChildren(node, context);
         }
         return this.processPartialWithChildren(node, context);
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
    * Process html element tag with no children and create partial node of abstract syntax tree.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {InlineTemplateNode | StaticPartialNode | DynamicPartialNode} Returns concrete instance of partial template.
    */
   private processPartialWithNoChildren(node: Nodes.Tag, context: ITraverseContext): Ast.InlineTemplateNode | Ast.StaticPartialNode | Ast.DynamicPartialNode {
      if (!node.isSelfClosing) {
         this.errorHandler.warn(
            `Для директивы ws:partial не задан контент и тег компонента не указан как самозакрывающийся`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
      }
      return this.createPartialOnly(node, context);
   }

   /**
    * Process partial node with its content.
    * @private
    * @param node {Tag} Html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {InlineTemplateNode | StaticPartialNode | DynamicPartialNode} Concrete instance of partial node of abstract syntax tree.
    */
   private processPartialWithChildren(node: Nodes.Tag, context: ITraverseContext): Ast.InlineTemplateNode | Ast.StaticPartialNode | Ast.DynamicPartialNode {
      const options = this.getComponentOrPartialOptions(node.children, context);
      const ast = this.createPartialOnly(node, context);
      this.applyOptionsToComponentOrPartial(ast, options, context, node);
      return ast;
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
   private createPartialOnly(node: Nodes.Tag, context: ITraverseContext): Ast.InlineTemplateNode | Ast.StaticPartialNode | Ast.DynamicPartialNode {
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
      const inlineTemplate = new Ast.InlineTemplateNode(template, attributes.attributes, attributes.events, attributes.options);
      context.scope.registerTemplateUsage(inlineTemplate.__$ws_name);
      return inlineTemplate;
   }

   // </editor-fold>

   // <editor-fold desc="Machine helpers">

   /**
    * Get options from object node or casted object property.
    * @param attributes {IAttributes} Attributes collection.
    * @param context {ITraverseContext} Processing context.
    * @param parentNode {Tag} Parent node that contains processing attributes.
    * @returns {IObjectProperties} Collection of properties.
    */
   private getObjectOptionsFromAttributes(attributes: Nodes.IAttributes, context: ITraverseContext, parentNode: Nodes.Tag): Ast.IObjectProperties {
      const processedAttributes = this.attributeProcessor.process(attributes, {
         fileName: context.fileName,
         hasAttributesOnly: false,
         parentTagName: parentNode.name
      });
      this.warnIncorrectProperties(processedAttributes.attributes, parentNode, context);
      this.warnIncorrectProperties(processedAttributes.events, parentNode, context);
      return <Ast.IObjectProperties>processedAttributes.options;
   }

   /**
    * Process component or partial node children.
    * @private
    * @param children {Node[]} Collection of child nodes of processing component or partial node.
    * @param context {ITraverseContext} Processing context.
    * @returns {<OptionNode | ContentOptionNode>} Returns collection of options and content options.
    */
   private getComponentOrPartialOptions(children: Nodes.Node[], context: ITraverseContext): Array<Ast.OptionNode | Ast.ContentOptionNode> {
      const contentContext: ITraverseContext = {
         ...context,
         state: TraverseState.COMPONENT_WITH_UNKNOWN_CONTENT
      };
      const content = this.visitAll(children, contentContext);
      if (isFirstChildContent(content)) {
         return [
            new Ast.ContentOptionNode(
               'content',
               <Ast.TContent[]>content
            )
         ];
      }
      return <Array<Ast.OptionNode | Ast.ContentOptionNode>>content;
   }

   /***
    * Apply processed collection of options and content options.
    * @private
    * @param ast {BaseWasabyElement} Node of abstract syntax tree. On this node collection of options will be applied.
    * @param options {Array<OptionNode | ContentOptionNode>} Collection of processed options.
    * @param context {ITraverseContext} Processing context.
    * @param node {Tag} Base html tag node of processing component or partial node.
    */
   private applyOptionsToComponentOrPartial(ast: Ast.BaseWasabyElement, options: Array<Ast.OptionNode | Ast.ContentOptionNode>, context: ITraverseContext, node: Nodes.Tag): void {
      for (let index = 0; index < options.length; ++index) {
         const child = options[index];
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
         ast.setOption(options[index]);
      }
   }

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
    * @param attributes {IAttributes} Collection of attributes.
    * @param context {ITraverseContext} Processing context.
    * @param nodeName {string} Tag node name that contains processing collection of attributes.
    */
   private warnUnexpectedAttributes(attributes: Nodes.IAttributes, context: ITraverseContext, nodeName: string): void {
      for (const name in attributes) {
         this.errorHandler.warn(
            `Обнаружен непредусмотренный атрибут "${name}" на теге "${nodeName}". Атрибут будет отброшен`,
            {
               fileName: context.fileName,
               position: attributes[name].position
            }
         );
      }
   }

   // </editor-fold>
}
