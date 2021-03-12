/**
 * @description Represents traverse machine.
 * @author Крылов М.А.
 */

import * as Nodes from 'Compiler/html/Nodes';
import * as Ast from 'Compiler/core/Ast';
import { IParser } from 'Compiler/expressions/Parser';
import { ProgramNode } from 'Compiler/expressions/Nodes';
import { IErrorHandler } from 'Compiler/utils/ErrorHandler';
import { IAttributeProcessor, createAttributeProcessor } from 'Compiler/core/Attributes';
import { ITextProcessor, createTextProcessor, TextContentFlags } from 'Compiler/core/Text';
import Scope from 'Compiler/core/Scope';
import * as Resolvers from 'Compiler/core/Resolvers';
import { ITextTranslator } from 'Compiler/i18n/Translator';
import createValidator, { IValidator } from 'Compiler/expressions/Validator';

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

   /**
    * Text translator.
    */
   textTranslator: ITextTranslator;

   /**
    * Generate translation nodes.
    */
   generateTranslations: boolean;

   /**
    * Warn in case of using useless attribute prefix.
    */
   warnUselessAttributePrefix?: boolean;

   /**
    * Warn unknown boolean attributes and options.
    */
   warnBooleanAttributesAndOptions?: boolean;

   /**
    * Warn about empty component content if component tag was not self-closing.
    */
   warnEmptyComponentContent?: boolean;
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

   /**
    * Allow translating text data.
    */
   translateText: boolean;
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
    * 1) BOOLEAN_DATA_TYPE, FUNCTION_DATA_TYPE, NUMBER_DATA_TYPE, STRING_DATA_TYPE, VALUE_DATA_TYPE
    *    - if processing node is boolean, function, number, string or value;
    * 2) ARRAY_DATA_TYPE - if processing node is array. Again.
    * 3) OBJECT_DATA_TYPE - if processing node is object.
    */
   ARRAY_DATA_TYPE,

   /**
    * In processing boolean type node content where only text is allowed.
    * In this state only text nodes can be processed. Before processing primitive value content
    * at parent node describes text content using special text content flags.
    * There are no jumps to other states.
    */
   BOOLEAN_DATA_TYPE,

   /**
    * In processing function type node content where only text is allowed.
    * In this state only text nodes can be processed. Before processing primitive value content
    * at parent node describes text content using special text content flags.
    * There are no jumps to other states.
    */
   FUNCTION_DATA_TYPE,

   /**
    * In processing number type node content where only text is allowed.
    * In this state only text nodes can be processed. Before processing primitive value content
    * at parent node describes text content using special text content flags.
    * There are no jumps to other states.
    */
   NUMBER_DATA_TYPE,

   /**
    * In processing string type node content where only text is allowed.
    * In this state only text nodes can be processed. Before processing primitive value content
    * at parent node describes text content using special text content flags.
    * There are no jumps to other states.
    */
   STRING_DATA_TYPE,

   /**
    * In processing value type node content where only text is allowed.
    * In this state only text nodes can be processed. Before processing primitive value content
    * at parent node describes text content using special text content flags.
    * There are no jumps to other states.
    */
   VALUE_DATA_TYPE,

   /**
    * In processing properties of object.
    * In this states only properties can be processed.
    * From this state only one jump is available - to OBJECT_PROPERTY_WITH_UNKNOWN_CONTENT.
    */
   OBJECT_DATA_TYPE,

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
    * In processing object property that contain data type node only.
    * In case of detected more than one data type nodes this state
    * will be changed to OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_ARRAY state.
    */
   OBJECT_PROPERTY_WITH_DATA_TYPE,

   /**
    * In processing object property that contain data type directives.
    * In this case data type directives will be processed into data type nodes,
    * these nodes will be packed into array, and this array will be a value of processing object property.
    */
   OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_ARRAY
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

   /**
    * Tag with name "component" and all its content need process uin state MARKUP
    * @deprecated
    */
   processingOldComponent: boolean;

   /**
    * Processing component path.
    */
   componentPath: string;

   /**
    * Processing component property path.
    */
   componentPropertyPath: string;

   /**
    * Type name from attribute.
    */
   explicitDataType: string;
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
      if (!prev.isElseIf()) {
         throw new Error(
            'ожидалось, что директива "ws:else" следует за директивной "ws:else", на котором задан атрибут "data"'
         );
      }
      return;
   }
   throw new Error('ожидалось, что директива "ws:else" следует за директивной "ws:if" или "ws:else" с атрибутом "data"');
}

/**
 * Clean primitive value from useless whitespaces.
 * @param children {TextNode[]} Processed boolean node content.
 */
function cleanPrimitiveValue(children: Ast.TextNode[]): Ast.TextNode[] {
   if (children.length !== 1) {
      return children;
   }
   const data = children[0].__$ws_content;
   const result: Ast.TText[] = [];
   for (let index = 0; index < data.length; ++index) {
      const child = data[index];
      if (child instanceof Ast.TextDataNode) {
         if (child.__$ws_content.trim().length === 0) {
            continue;
         }
      }
      result.push(child);
   }
   return [
      new Ast.TextNode(result)
   ];
}

/**
 * Get validated text data from text node.
 * @param children {TextNode[]} Text node.
 * @returns {TText[]} Text nodes collection.
 */
function getTextData(children: Ast.TextNode[]): Ast.TText[] {
   if (children.length === 0) {
      throw new Error('не задано значение');
   }
   if (children.length !== 1) {
      throw new Error('данные некорректного типа');
   }
   const data = children[0].__$ws_content;
   if (data.length !== 1) {
      throw new Error('данные некорректного типа - ожидался текст или Mustache-выражение');
   }
   return data;
}

/**
 * Validate processed boolean node content.
 * @param children {TextNode[]} Processed boolean node content.
 * @throws {Error} Throws Error in case of invalid boolean semantics.
 */
function validateBoolean(children: Ast.TextNode[]): void {
   const data = getTextData(children);
   for (let index = 0; index < data.length; ++index) {
      const child = data[index];
      if (child instanceof Ast.TextDataNode) {
         if (child.__$ws_content !== 'true' && child.__$ws_content !== 'false') {
            throw new Error(`ожидалось одно из значений - true/false, получено - "${child.__$ws_content}"`);
         }
      }
      if (child instanceof Ast.TranslationNode) {
         throw new Error('использование конструкции локализации недопустимо');
      }
   }
}

/**
 * Validate processed number node content.
 * @param children {TextNode[]} Processed number node content.
 * @throws {Error} Throws Error in case of invalid number semantics.
 */
function validateNumber(children: Ast.TextNode[]): void {
   const data = getTextData(children);
   for (let index = 0; index < data.length; ++index) {
      const child = data[index];
      if (child instanceof Ast.TextDataNode) {
         if (isNaN(+child.__$ws_content)) {
            throw new Error(`получено нечисловое значение - "${child.__$ws_content}"`);
         }
      }
      if (child instanceof Ast.TranslationNode) {
         throw new Error('использование конструкции локализации недопустимо');
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

const FORBIDDEN_FUNCTION_CHARACTERS_PATTERN: RegExp = /[~`@"'#$%^&*()+=?<>{}\[\];,№]+/gi;

function isValidFunctionText(text: string): boolean {
   FORBIDDEN_FUNCTION_CHARACTERS_PATTERN.lastIndex = 0;
   return !FORBIDDEN_FUNCTION_CHARACTERS_PATTERN.test(text);
}

function validateFunctionContent(content: Ast.TText[]): void {
   for (let index = 0; index < content.length; ++index) {
      const textDataNode = content[index];
      // Validate only text node
      if (!(textDataNode instanceof Ast.TextDataNode)) {
         continue;
      }
      const text = textDataNode.__$ws_content;
      if (!isValidFunctionText(text)) {
         throw new Error(`содержимое или его часть "${text}" невалидно`);
      }
   }
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

/**
 * Process expression "identifier as alias" and return alias name.
 * @deprecated
 * @param identifier {string} Expression that can contain alias.
 * @returns {string} Alias name.
 */
function useIdentifierAlias(identifier: string): string {
   if (identifier.indexOf(' as ') === -1) {
      return identifier;
   }
   const params = identifier.split(' as ');
   if (params.length > 2) {
      throw new Error(`указано более 1 алиаса для идентификатора - "${identifier}"`);
   }
   return params[1];
}

/**
 * Get processing expectation for handling an error.
 * @param state {TraverseState} Current processing state.
 */
function whatExpected(state: TraverseState): string {
   switch (state) {
      case TraverseState.COMPONENT_WITH_OPTIONS:
         return 'ожидались опции компонента или директивы "ws:partial"';
      case TraverseState.ARRAY_DATA_TYPE:
      case TraverseState.OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_ARRAY:
         return 'ожидались директивы типов данных для массива';
      case TraverseState.OBJECT_DATA_TYPE:
      case TraverseState.OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_OBJECT:
         return 'ожидались опции объекта';
      case TraverseState.OBJECT_PROPERTY_WITH_DATA_TYPE:
         return 'ожидалась директива типа данных для опции';
      case TraverseState.BOOLEAN_DATA_TYPE:
         return 'ожидался текст для типа данных Boolean';
      case TraverseState.FUNCTION_DATA_TYPE:
         return 'ожидался текст для типа данных Function';
      case TraverseState.NUMBER_DATA_TYPE:
         return 'ожидался текст для типа данных Number';
      case TraverseState.STRING_DATA_TYPE:
         return 'ожидался текст для типа данных String';
      case TraverseState.VALUE_DATA_TYPE:
         return 'ожидался текст для типа данных Value';
   }
}

/**
 * Check for text content.
 * It is used for only bug when content option has type="string".
 * @deprecated
 * @param children {Node[]} Collection of html nodes.
 */
function hasTextContent(children: Nodes.Node[]): boolean {
   return children.every((node: Nodes.Node) => node instanceof Nodes.Text);
}

/**
 * Check for single data type node.
 * @deprecated
 * @param children {Node[]} Collection of html nodes.
 */
function hasDataTypeContent(children: Nodes.Node[]): boolean {
   if (children.length !== 1) {
      return false;
   }
   const firstChild = children[0];
   if (!(firstChild instanceof Nodes.Tag)) {
      return false;
   }
   return [
      'ws:Array',
      'ws:Boolean',
      'ws:Function',
      'ws:Number',
      'ws:Object',
      'ws:String',
      'ws:Value'
   ].indexOf(firstChild.name) > -1;
}

// </editor-fold>

/**
 * Represents traverse finite state machine.
 */
class Traverse implements ITraverse {

   // <editor-fold desc="Traverse properties">

   /**
    * Mustache expression parser.
    * @private
    * @readonly
    */
   private readonly expressionParser: IParser;

   /**
    * Error handler.
    * @private
    * @readonly
    */
   private readonly errorHandler: IErrorHandler;

   /**
    * Allow creating comment nodes in abstract syntax tree.
    * @private
    * @readonly
    */
   private readonly allowComments: boolean;

   /**
    * Attribute processor.
    * @private
    * @readonly
    */
   private readonly attributeProcessor: IAttributeProcessor;

   /**
    * Text processor.
    * @private
    * @readonly
    */
   private readonly textProcessor: ITextProcessor;

   /**
    * Text translator.
    */
   private readonly textTranslator: ITextTranslator;

   /**
    * Warn about empty component content if component tag was not self-closing.
    */
   private readonly warnEmptyComponentContent: boolean;

   /**
    * Mustache-expressions validator.
    */
   private readonly expressionValidator: IValidator;

   // </editor-fold>

   /**
    * Initialize new instance of traverse machine.
    * @param config {ITraverseConfig} Traverse machine configuration.
    */
   constructor(config: ITraverseConfig) {
      this.expressionParser = config.expressionParser;
      this.errorHandler = config.errorHandler;
      this.allowComments = config.allowComments;
      this.expressionValidator = createValidator(config.errorHandler);
      this.textProcessor = createTextProcessor({
         expressionParser: config.expressionParser,
         expressionValidator: this.expressionValidator,
         generateTranslations: config.generateTranslations
      });
      this.attributeProcessor = createAttributeProcessor({
         expressionParser: config.expressionParser,
         errorHandler: config.errorHandler,
         textProcessor: this.textProcessor,
         warnBooleanAttributesAndOptions: !!config.warnBooleanAttributesAndOptions,
         warnUselessAttributePrefix: !!config.warnUselessAttributePrefix,
         expressionValidator: this.expressionValidator
      });
      this.textTranslator = config.textTranslator;
      this.warnEmptyComponentContent = !!config.warnEmptyComponentContent;
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
         textContent: TextContentFlags.FULL_TEXT,
         translateText: options.translateText,
         processingOldComponent: false,
         componentPropertyPath: null,
         componentPath: null,
         explicitDataType: null
      };
      return this.visitAll(nodes, context);
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
      for (let index = 0; index < nodes.length; ++index) {
         childContext.prev = children[children.length - 1] || null;
         const child = <Ast.Ast>nodes[index].accept(this, childContext);
         if (child) {
            // Text content can be separated by comment node. Merge it!
            const lastNode = children[children.length - 1];
            if (lastNode instanceof Ast.TextNode && child instanceof Ast.TextNode) {
               const shift = lastNode.__$ws_content.length;
               for (let index = 0; index < child.__$ws_content.length; ++index) {
                  child.__$ws_content[index].setKey(shift + index);
               }
               lastNode.__$ws_content = lastNode.__$ws_content.concat(child.__$ws_content);
               continue;
            }
            child.setKey(children.length);
            children.push(child);
         }
      }
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
               `Обнаружен непредусмотренный тег CData: ${whatExpected(context.state)}. Тег будет проигнорирован, его необходимо убрать`,
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
               `Обнаружен непредусмотренный тег Doctype: ${whatExpected(context.state)}. Тег будет проигнорирован, его необходимо убрать`,
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
               `Обнаружен непредусмотренный тег Instruction: ${whatExpected(context.state)}. Тег будет проигнорирован, его необходимо убрать`,
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
         case TraverseState.BOOLEAN_DATA_TYPE:
         case TraverseState.FUNCTION_DATA_TYPE:
         case TraverseState.NUMBER_DATA_TYPE:
         case TraverseState.STRING_DATA_TYPE:
         case TraverseState.VALUE_DATA_TYPE:
            return this.processText(node, context);
         default:
            this.errorHandler.error(
               `Обнаружен непредусмотренный текст "${node.data}": ${whatExpected(context.state)}. Текст будет проигнорирован, его необходимо убрать`,
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
         case TraverseState.COMPONENT_WITH_CONTENT:
         case TraverseState.COMPONENT_WITH_OPTIONS:
            return this.processTagInComponentWithUnknownContent(node, context);
         case TraverseState.ARRAY_DATA_TYPE:
            return this.processDataTypeTag(node, context);
         case TraverseState.OBJECT_DATA_TYPE:
            return this.processTagInObjectProperties(node, context);
         case TraverseState.OBJECT_PROPERTY_WITH_UNKNOWN_CONTENT:
         case TraverseState.OBJECT_PROPERTY_WITH_CONTENT:
         case TraverseState.OBJECT_PROPERTY_WITH_DATA_TYPE:
         case TraverseState.OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_ARRAY:
         case TraverseState.OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_OBJECT:
            return this.processTagInObjectPropertyWithUnknownContent(node, context);
         case TraverseState.BOOLEAN_DATA_TYPE:
         case TraverseState.FUNCTION_DATA_TYPE:
         case TraverseState.NUMBER_DATA_TYPE:
         case TraverseState.STRING_DATA_TYPE:
         case TraverseState.VALUE_DATA_TYPE:
            return this.processDoubleTypeDefinition(node, context);
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
         default:
            if (this.validateForbiddenDataTypeNode(node, context)) {
               return null;
            }
            if (Resolvers.isOption(node.name)) {
               this.errorHandler.error(
                  `Обнаружена неизвестная директива "${node.name}"`,
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
   private processDataTypeTag(node: Nodes.Tag, context: ITraverseContext): Ast.TData {
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
            this.errorHandler.critical(
               `Обнаружен тег "${node.name}" вместо ожидаемой директивы данных`,
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
         default:
            if (this.validateForbiddenDataTypeNode(node, context)) {
               return null;
            }
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
         this.errorHandler.critical(
            `Запрещено смешивать контент по умолчанию с опциями - обнаружен тег "${node.name}". ` +
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
         this.errorHandler.critical(
            `Запрещено смешивать контент по умолчанию с опциями - обнаружена опция "${node.name}". ` +
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
            this.errorHandler.critical(
               `Использование директивы "${node.name}" внутри директивы "ws:Object" запрещено. Ожидалась опция объекта`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
         default:
            if (this.validateForbiddenDataTypeNode(node, context)) {
               return null;
            }
            if (Resolvers.isOption(node.name)) {
               return this.processProperty(node, context);
            }
            this.errorHandler.critical(
               `Обнаружен тег "${node.name}" вместо ожидаемой опции объекта`,
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
         this.errorHandler.critical(
            `Запрещено смешивать контент, директивы типов данных и опции. Обнаружен тег "${node.name}". Ожидался контент`,
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
      switch (context.state) {
         case TraverseState.OBJECT_PROPERTY_WITH_UNKNOWN_CONTENT:
            context.state = TraverseState.OBJECT_PROPERTY_WITH_DATA_TYPE;
            return this.processDataTypeTag(node, context);
         case TraverseState.OBJECT_PROPERTY_WITH_DATA_TYPE:
            context.state = TraverseState.OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_ARRAY;
            return this.processDataTypeTag(node, context);
         case TraverseState.OBJECT_PROPERTY_WITH_CONTENT_TYPE_CASTED_TO_ARRAY:
            return this.processDataTypeTag(node, context);
         default:
            this.errorHandler.critical(
               `Запрещено смешивать контент, директивы типов данных и опции. Обнаружен тег "${node.name}". Ожидалась опция`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return null;
      }
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
         this.errorHandler.critical(
            `Запрещено смешивать контент, директивы типов данных и опции. Обнаружен тег "${node.name}". Ожидалась опция`,
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
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | null} Returns node type of TContent or null in case of broken content.
    */
   private checkDirectiveInAttribute(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
      const hasCycleDirective = node.attributes.hasOwnProperty('for') && node.name !== 'label';
      const hasConditionalDirective = node.attributes.hasOwnProperty('if');
      if (hasCycleDirective && hasConditionalDirective) {
         // HTML Specification says:
         //   The order of attributes in HTML elements doesn't matter at all.
         //   You can write the attributes in any order you like.
         this.errorHandler.error(
            `Обнаружено использование одновременно двух директив "if" и "for" в атрибутах тега "${node.name}". Будет использован сначала "if", затем "for". ` +
            'Необходимо задать соответствующие директивы вне атрибутов, чтобы гарантировать правильный порядок их выполнения',
            {
               fileName: context.fileName,
               position: node.position
            }
         );
      }
      if (hasConditionalDirective) {
         return this.unpackConditionalDirective(node, context);
      }
      if (hasCycleDirective) {
         return this.unpackCycleDirective(node, context);
      }
      return this.processContentTagWithoutUnpacking(node, context);
   }

   /**
    * Unpack for directive from attribute of content type html tag node.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | null} Returns node type of TContent or null in case of broken content.
    */
   private unpackCycleDirective(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
      const directiveData = node.attributes.for;
      // FIXME: Don't modify source html tree
      delete node.attributes.for;
      // FIXME: Double unpacking
      const ast = this.checkDirectiveInAttribute(node, context);
      if (ast === null) {
         return null;
      }
      const cycleDirective = this.processForAttribute(node, context, directiveData);
      if (cycleDirective === null) {
         return ast;
      }
      cycleDirective.setFlag(Ast.Flags.UNPACKED);
      cycleDirective.__$ws_content = [ast];
      return cycleDirective;
   }

   /**
    * Unpack for directive from attribute of content type html tag node.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TContent | null} Returns node type of TContent or null in case of broken content.
    */
   private unpackConditionalDirective(node: Nodes.Tag, context: ITraverseContext): Ast.TContent {
      const directiveData = node.attributes.if;
      // FIXME: Don't modify source html tree
      delete node.attributes.if;
      // FIXME: Double unpacking
      const ast = this.checkDirectiveInAttribute(node, context);
      if (ast === null) {
         return null;
      }
      const conditionalDirective = this.processConditionalAttribute(node, context, directiveData);
      if (conditionalDirective === null) {
         return ast;
      }
      conditionalDirective.setFlag(Ast.Flags.UNPACKED);
      conditionalDirective.__$ws_consequent = [ast];
      return conditionalDirective;
   }


   /**
    * Process "if" attribute value.
    * @private
    * @param node {Tag} Processing tag node.
    * @param context {ITraverseContext} Processing context.
    * @param attribute {Attribute} "if" attribute.
    */
   private processConditionalAttribute(node: Nodes.Tag, context: ITraverseContext, attribute: Nodes.Attribute): Ast.IfNode {
      try {
         if (attribute.value === null) {
            throw new Error('не задано значение директивы');
         }
         const value = this.textProcessor.process(
            attribute.value,
            {
               fileName: context.fileName,
               allowedContent: TextContentFlags.EXPRESSION,
               translateText: false,
               translationsRegistrar: context.scope,
               position: node.position
            }
         );
         if (value.length !== 1) {
            throw new Error('не удалось извлечь значение директивы');
         }
         const ast = new Ast.IfNode();
         ast.__$ws_test = (<Ast.ExpressionNode>value[0]).__$ws_program;
         return ast;
      } catch (error) {
         this.errorHandler.critical(
            `Ошибка обработки директивы "if" на атрибуте тега "${node.name}": ${error.message}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return null;
      }
   }

   /**
    * Process "for" attribute value.
    * @private
    * @param node {Tag} Processing tag node.
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
               allowedContent: TextContentFlags.TEXT,
               translateText: false,
               translationsRegistrar: context.scope,
               position: node.position
            }
         );
         if (textValue.length !== 1) {
            throw new Error('не удалось извлечь параметры цикла');
         }
         const cycleData = (<Ast.TextDataNode>textValue[0]).__$ws_content;
         if (cycleData.indexOf(';') > -1) {
            const { init, test, update } = this.parseForParameters(cycleData);
            return new Ast.ForNode(init, test, update, []);
         }
         const { index, iterator, collection } = this.parseForeachParameters(cycleData);
         return new Ast.ForeachNode(index, iterator, collection, []);
      } catch (error) {
         this.errorHandler.critical(
            `Ошибка обработки директивы "for" на атрибуте тега "${node.name}": ${error.message}`,
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

      // FIXME: Deprecated legacy behaviour. Remove components from template files *.tmpl, *.wml
      if (node.name === 'component') {
         const oldComponentContext: ITraverseContext = {
            ...context,
            processingOldComponent: true
         };
         return this.processElement(node, oldComponentContext);
      }
      return this.processElement(node, context);
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
      let isStringTypeContentOption = false;
      if (canBeTypeCasted(node)) {
         if (node.attributes.type.value !== 'string' || hasTextContent(node.children) || hasDataTypeContent(node.children)) {
            return this.castPropertyWithType(node, context);
         }
         // FIXME: Incorrect legacy behaviour - type="string" on content option of component or ws:partial.
         //  Ignore user type, remove type from attributes collection and process as content option node.
         delete node.attributes.type;
         isStringTypeContentOption = true;
      }
      const name = Resolvers.resolveOption(node.name);
      const propertyContext: ITraverseContext = {
         ...context,
         state: TraverseState.OBJECT_PROPERTY_WITH_UNKNOWN_CONTENT,
         componentPropertyPath: context.componentPropertyPath ? context.componentPropertyPath + '/' + name : name
      };
      const content = this.visitAll(node.children, propertyContext);
      const hasContentOnly = content.every((child: Ast.Ast) => Ast.isTypeofContent(child)) && content.length > 0;
      if (hasContentOnly) {
         this.warnUnexpectedAttributes(node.attributes, context, node.name);
         return new Ast.ContentOptionNode(
            name,
            <Ast.TContent[]>content,
            isStringTypeContentOption
         );
      }
      const hasDataTypeOnly = content.every((child: Ast.Ast) => Ast.isTypeofData(child)) && content.length > 0;
      if (hasDataTypeOnly) {
         this.warnUnexpectedAttributes(node.attributes, context, node.name);
         if (content.length === 1) {
            return new Ast.OptionNode(
               name,
               <Ast.TData>content[0]
            );
         }
         const array = new Ast.ArrayNode(<Ast.TData[]>content);
         array.setFlag(Ast.Flags.TYPE_CASTED);
         return new Ast.OptionNode(
            name,
            array
         );
      }
      const properties = this.attributeProcessor.processOptions(node.attributes, {
         fileName: context.fileName,
         hasAttributesOnly: false,
         parentTagName: node.name,
         translationsRegistrar: context.scope
      });
      for (let index = 0; index < content.length; ++index) {
         const property = content[index];
         if (!(property instanceof Ast.OptionNode || property instanceof Ast.ContentOptionNode)) {
            this.errorHandler.critical(
               `Опция "${node.name}" содержит некорректные данные`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            continue;
         }
         if (properties.hasOwnProperty(property.__$ws_name)) {
            this.errorHandler.error(
               `Опция "${property.__$ws_name}" уже существует на теге "${node.name}"`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            continue;
         }
         properties[property.__$ws_name] = property;
      }
      const objectNode = new Ast.ObjectNode(properties);
      objectNode.setFlag(Ast.Flags.TYPE_CASTED);
      return new Ast.OptionNode(
         name,
         objectNode
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
         // FIXME: Legacy translation rule
         //   If config is not a component's option, mark text as translatable if it is a simple
         //   text node (config._optionName is missing), or if it is the `title` attribute of
         //   a tag (_optionName[0] === 'title', title is always translatable)
         const isOptionTranslatable = this.textTranslator
            .getComponentDescription(context.componentPath)
            .isOptionTranslatable(context.componentPropertyPath);
         const translateText = !context.processingOldComponent && context.translateText && (
            isOptionTranslatable ||
            context.componentPropertyPath === null || (
               typeof context.componentPropertyPath === 'string' &&
               context.componentPropertyPath.length === 0
            )
         );

         // Process text node content.
         // If text is invalid then an error will be thrown.
         const content = this.textProcessor.process(node.data, {
            fileName: context.fileName,
            allowedContent: context.textContent || TextContentFlags.FULL_TEXT,
            translationsRegistrar: context.scope,
            position: node.position,
            translateText
         });

         // Set keys onto text content nodes.
         for (let index = 0; index < content.length; ++index) {
            content[index].setKey(index);
         }

         // Pack the processed data
         return new Ast.TextNode(content);
      } catch (error) {
         this.errorHandler.critical(
            `Ошибка обработки текста "${node.data}": ${error.message}`,
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
      const explicitDataType = node.attributes.type.value;
      const attributes: Nodes.IAttributes = {
         ...node.attributes
      };
      delete attributes.type;
      const internalContext: ITraverseContext = {
         ...context,
         explicitDataType
      };
      switch (explicitDataType) {
         case 'array':
            return this.castPropertyContentToArray(node, internalContext, attributes);
         case 'boolean':
            return this.castPropertyContentToBoolean(node, internalContext, attributes);
         case 'function':
            return this.castPropertyContentToFunction(node, internalContext, attributes);
         case 'number':
            return this.castPropertyContentToNumber(node, internalContext, attributes);
         case 'object':
            return this.castPropertyContentToObject(node, internalContext, attributes);
         case 'string':
            return this.castPropertyContentToString(node, internalContext, attributes);
         case 'value':
            return this.castPropertyContentToValue(node, internalContext, attributes);
      }
      this.errorHandler.fatal(
         `Не удалось определить тип опции "${node.name}" для выполнения приведения`,
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
         elements.setFlag(Ast.Flags.OBVIOUSLY_TYPE_CASTED);
         return new Ast.OptionNode(name, elements);
      } catch (error) {
         this.errorHandler.critical(
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
         value.setFlag(Ast.Flags.OBVIOUSLY_TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.critical(
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
         const { functionExpression, options } = this.processFunctionContent(node, context, attributes);
         const name = Resolvers.resolveOption(node.name);
         const value = new Ast.FunctionNode(functionExpression, options);
         value.setFlag(Ast.Flags.OBVIOUSLY_TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.critical(
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
         value.setFlag(Ast.Flags.OBVIOUSLY_TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.critical(
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
         value.setFlag(Ast.Flags.OBVIOUSLY_TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.critical(
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
         value.setFlag(Ast.Flags.OBVIOUSLY_TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.critical(
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
         value.setFlag(Ast.Flags.OBVIOUSLY_TYPE_CASTED);
         return new Ast.OptionNode(name, value);
      } catch (error) {
         this.errorHandler.critical(
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
      const childrenContext: ITraverseContext = {
         ...context,
         state: TraverseState.MARKUP,
         translateText: this.textTranslator.isElementContentTranslatable(node.name)
      };
      const content = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
      const elementDescription = this.textTranslator.getElementDescription(node.name);
      const attributeProcessorOptions = {
         fileName: context.fileName,
         hasAttributesOnly: true,
         parentTagName: node.name,
         translationsRegistrar: context.scope
      };
      const attributes = this.attributeProcessor.process(
         node.attributes,
         attributeProcessorOptions,
         elementDescription
      );
      return new Ast.ElementNode(node.name, attributes.attributes, attributes.events, content);
   }

   // <editor-fold desc="Processing data type nodes">

   /**
    * Test potential processing node and converting it to concrete type.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @param state {TraverseState} Required processing state that depends on data type directive name.
    * @param isDirectiveProvided {boolean} Primitive data flag. True for data types which must contains text only.
    * @returns {boolean} Returns true in case of correct node contents.
    */
   private testDoubleTypeDefinition(node: Nodes.Tag, context: ITraverseContext, state: TraverseState, isDirectiveProvided: boolean = true): boolean {
      if (context.explicitDataType === null || !isDirectiveProvided) {
         this.errorHandler.critical(
            `Обнаружена непредусмотренная директива "${node.name}": ${whatExpected(context.state)}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return false;
      }
      if (context.state !== state) {
         this.errorHandler.critical(
            `Директива "${node.name}" не соответствует заданному типу "${context.explicitDataType}"`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         return false;
      }
      return true;
   }

   /**
    * Process data type content.
    * @private
    * @param node {Tag} Processing html tag node.
    * @param context {ITraverseContext} Processing context.
    * @returns {TData | null} Returns instance of concrete TData or null in case of broken content.
    */
   private processDoubleTypeDefinition(node: Nodes.Tag, context: ITraverseContext): Ast.TextNode {
      const internalContext: ITraverseContext = {
         ...context,
         explicitDataType: null
      };
      let content = [];
      switch (node.name) {
         case 'ws:Array':
            this.testDoubleTypeDefinition(node, context, TraverseState.ARRAY_DATA_TYPE, false);
            break;
         case 'ws:Object':
            this.testDoubleTypeDefinition(node, context, TraverseState.OBJECT_DATA_TYPE, false);
            break;
         case 'ws:Function':
            this.testDoubleTypeDefinition(node, context, TraverseState.FUNCTION_DATA_TYPE, false);
            break;
         case 'ws:Boolean':
            if (!this.testDoubleTypeDefinition(node, context, TraverseState.BOOLEAN_DATA_TYPE)) {
               break;
            }
            const booleanNode = this.processBoolean(node, internalContext);
            if (booleanNode !== null) {
               content = booleanNode.__$ws_data;
            }
            break;
         case 'ws:Number':
            if (!this.testDoubleTypeDefinition(node, context, TraverseState.NUMBER_DATA_TYPE)) {
               break;
            }
            const numberNode = this.processNumber(node, internalContext);
            if (numberNode !== null) {
               content = numberNode.__$ws_data;
            }
            break;
         case 'ws:String':
            if (!this.testDoubleTypeDefinition(node, context, TraverseState.STRING_DATA_TYPE)) {
               break;
            }
            const stringNode = this.processString(node, internalContext);
            if (stringNode !== null) {
               content = stringNode.__$ws_data;
            }
            break;
         case 'ws:Value':
            if (!this.testDoubleTypeDefinition(node, context, TraverseState.VALUE_DATA_TYPE)) {
               break;
            }
            const valueNode = this.processValue(node, internalContext);
            if (valueNode !== null) {
               content = valueNode.__$ws_data;
            }
            break;
         default:
            this.errorHandler.error(
               `Обнаружен непредусмотренный тег "${node.name}": ${whatExpected(context.state)}. Тег будет проигнорирован, его необходимо убрать`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            break;
      }
      return new Ast.TextNode(content);
   }

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
         this.errorHandler.critical(
            `Ошибка разбора директивы данных "ws:Array": ${error.message}`,
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
      const childrenContext: ITraverseContext = {
         ...context,
         state: TraverseState.ARRAY_DATA_TYPE,
         explicitDataType: null
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
         this.errorHandler.critical(
            `Ошибка разбора директивы данных "ws:Boolean": ${error.message}`,
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
      const childrenContext: ITraverseContext = {
         ...context,
         state: TraverseState.BOOLEAN_DATA_TYPE,
         textContent: TextContentFlags.TEXT_AND_EXPRESSION,
         translateText: false
      };
      this.warnUnexpectedAttributes(attributes, context, node.name);
      const children = <Ast.TextNode[]>this.visitAll(node.children, childrenContext);
      const content = cleanPrimitiveValue(children);
      validateBoolean(content);
      return content[0].__$ws_content;
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
         const { functionExpression, options } = this.processFunctionContent(node, context, node.attributes);
         return new Ast.FunctionNode(functionExpression, options);
      } catch (error) {
         this.errorHandler.critical(
            `Ошибка разбора директивы данных "ws:Function": ${error.message}`,
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
   private processFunctionContent(node: Nodes.Tag, context: ITraverseContext, attributes: Nodes.IAttributes): { functionExpression: Ast.TText[]; options: Ast.IOptions; } {
      const childrenContext: ITraverseContext = {
         ...context,
         state: TraverseState.FUNCTION_DATA_TYPE,
         textContent: TextContentFlags.TEXT_AND_EXPRESSION,
         translateText: false
      };
      const textNodes = <Ast.TextNode[]>this.visitAll(node.children, childrenContext);
      if (textNodes.length !== 1) {
         throw new Error('получены некорректные данные');
      }
      const content = cleanPrimitiveValue(textNodes);
      const functionExpression = content[0].__$ws_content;
      const options = this.attributeProcessor.process(
         attributes,
         {
            fileName: context.fileName,
            hasAttributesOnly: false,
            parentTagName: node.name,
            translationsRegistrar: context.scope
         }
      );
      this.warnIncorrectProperties(options.attributes, node, context);
      this.warnIncorrectProperties(options.events, node, context);
      validateFunctionContent(functionExpression);
      return {
         functionExpression,
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
         this.errorHandler.critical(
            `Ошибка разбора директивы данных "ws:Number": ${error.message}`,
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
      const childrenContext: ITraverseContext = {
         ...context,
         state: TraverseState.NUMBER_DATA_TYPE,
         textContent: TextContentFlags.TEXT_AND_EXPRESSION,
         translateText: false
      };
      this.warnUnexpectedAttributes(attributes, context, node.name);
      const children = <Ast.TextNode[]>this.visitAll(node.children, childrenContext);
      const content = cleanPrimitiveValue(children);
      validateNumber(content);
      return content[0].__$ws_content;
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
   private processObject(node: Nodes.Tag, context: ITraverseContext): Ast.ObjectNode | Ast.TData {
      try {
         // FIXME: <ws:Object>Some text</ws:Object>
         if (hasTextContent(node.children) && node.children.length > 0) {
            return this.processValue(node, context);
         }
         // FIXME: <ws:Object><ws:Type>...</ws:Type></ws:Object>
         if (hasDataTypeContent(node.children) && node.children.length > 0) {
            return this.processArrayContent(node, context, node.attributes)[0];
         }
         return new Ast.ObjectNode(
            this.processObjectContent(node, context, node.attributes)
         );
      } catch (error) {
         this.errorHandler.critical(
            `Ошибка разбора директивы данных "ws:Object": ${error.message}`,
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
         state: TraverseState.OBJECT_DATA_TYPE
      };
      const processedChildren = this.visitAll(node.children, propertiesContext);
      const properties = this.attributeProcessor.processOptions(attributes, {
         fileName: context.fileName,
         hasAttributesOnly: false,
         parentTagName: node.name,
         translationsRegistrar: context.scope
      });
      for (let index = 0; index < processedChildren.length; ++index) {
         const child = processedChildren[index];
         if (!(child instanceof Ast.OptionNode || child instanceof Ast.ContentOptionNode)) {
            this.errorHandler.fatal(
               `Тег "${node.name}" содержит некорректные данные`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            continue;
         }
         if (properties.hasOwnProperty(child.__$ws_name)) {
            this.errorHandler.error(
               `Опция "${child.__$ws_name}" уже определена на директиве "ws:Object"`,
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
         this.errorHandler.critical(
            `Ошибка разбора директивы данных "ws:String": ${error.message}`,
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
      const childrenContext: ITraverseContext = {
         ...context,
         state: TraverseState.STRING_DATA_TYPE,
         textContent: TextContentFlags.FULL_TEXT,
         translateText: this.textTranslator.getComponentDescription(context.componentPath).isOptionTranslatable(context.componentPropertyPath)
      };
      this.warnUnexpectedAttributes(attributes, context, node.name);
      const children = <Ast.TextNode[]>this.visitAll(node.children, childrenContext);
      if (children.length === 1) {
         return children[0].__$ws_content;
      }
      return [
         new Ast.TextDataNode('')
      ];
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
         this.errorHandler.critical(
            `Ошибка разбора директивы данных "ws:Value": ${error.message}`,
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
      const childrenContext: ITraverseContext = {
         ...context,
         state: TraverseState.VALUE_DATA_TYPE,
         textContent: TextContentFlags.FULL_TEXT,
         translateText: false
      };
      this.warnUnexpectedAttributes(attributes, context, node.name);
      const children = <Ast.TextNode[]>this.visitAll(node.children, childrenContext);
      if (children.length === 1) {
         return children[0].__$ws_content;
      }
      return [
         new Ast.TextDataNode('')
      ];
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
      const ast = new Ast.IfNode();
      const childrenContext = {
         ...context,
         state: TraverseState.MARKUP
      };
      const consequent = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
      ast.setConsequent(consequent);
      try {
         const test = this.getProgramNodeFromAttribute(node, 'data', context);
         ast.setTest(test);
         return ast;
      } catch (error) {
         this.errorHandler.critical(
            `Ошибка разбора директивы "ws:if": ${error.message}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         ast.setFlag(Ast.Flags.BROKEN);
         return ast;
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
      const isElseIf = node.attributes.hasOwnProperty('data');
      const ast = new Ast.ElseNode(isElseIf);
      const childrenContext = {
         ...context,
         state: TraverseState.MARKUP
      };
      const consequent = <Ast.TContent[]>this.visitAll(node.children, childrenContext);
      ast.setConsequent(consequent);
      try {
         let test = null;
         if (isElseIf) {
            test = this.getProgramNodeFromAttribute(node, 'data', context);
         }
         ast.setTest(test);
         validateElseNode(childrenContext.prev);
         return ast;
      } catch (error) {
         this.errorHandler.critical(
            `Ошибка разбора директивы "ws:else": ${error.message}`,
            {
               fileName: context.fileName,
               position: node.position
            }
         );
         ast.setFlag(Ast.Flags.BROKEN);
         return ast;
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
         this.errorHandler.critical(
            `Ошибка разбора директивы "ws:for": ${error.message}`,
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
         // TODO: Validate inline template name
         const ast = new Ast.TemplateNode(name, content);
         if (content.length === 0) {
            this.errorHandler.critical(
               `Содержимое директивы "ws:template" не должно быть пустым`,
               {
                  fileName: childrenContext.fileName,
                  position: node.position
               }
            );
         }
         context.scope.registerTemplate(name, ast);
         return ast;
      } catch (error) {
         this.errorHandler.critical(
            `Ошибка разбора директивы "ws:template": ${error.message}`,
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
      const parameters = data.split(';').map((s: string) => s.trim());
      if (parameters.length !== 3) {
         // case "[init]; test; [update];" is also correct
         if (parameters.length !== 4 || (parameters[4] || '').length !== 0) {
            throw new Error(
               `цикл задан некорректно. Ожидалось соответствие шаблону "[init]; test; [update]". Получено: "${data}"`
            );
         }
      }
      const [initExpression, testExpression, updateExpression] = parameters;
      let init;
      let test;
      let update;
      if (testExpression.length === 0) {
         throw new Error('отсутствует обязательное выражение условия цикла');
      }
      try {
         init = initExpression ? this.expressionParser.parse(initExpression) : null;
      } catch (error) {
         throw new Error(`выражение инициализации цикла "${initExpression}" задано некорректно`);
      }
      try {
         test = this.expressionParser.parse(testExpression);
      } catch (error) {
         throw new Error(`выражение условия цикла "${testExpression}" задано некорректно`);
      }
      try {
         update = updateExpression ? this.expressionParser.parse(updateExpression) : null;
      } catch (error) {
         throw new Error(`выражение обновления цикла "${updateExpression}" задано некорректно`);
      }
      return {
         init,
         test,
         update
      };
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
      // FIXME: remove this code
      let [indexIteratorString, collectionExpression] = params;
      if (indexIteratorString.indexOf(' as ') > -1) {
         const asParameters = indexIteratorString.split(' as ');
         if (asParameters.length !== 2) {
            throw new Error(
               `цикл задан некорректно. Ожидалось соответствие шаблону "[index, ] iterator in collection". Получено: "${data}"`
            );
         }
         indexIteratorString = `${asParameters[0]}, ${asParameters[1]}`;
      }
      const variables = indexIteratorString.split(',').map(s => s.trim());
      if (variables.length < 1 ||variables.length > 2) {
         throw new Error(
            `цикл задан некорректно. Ожидалось соответствие шаблону "[index, ] iterator in collection". Получено: "${data}"`
         );
      }
      const iteratorString = variables.pop();
      const indexString = variables.length == 1 ? variables.pop() : null;
      let iterator;
      let index;
      let collection;
      try {
         const iteratorExpression = useIdentifierAlias(iteratorString);
         iterator = this.expressionParser.parse(iteratorExpression);
      } catch (error) {
         throw new Error(
            `итератор цикла "${iteratorString}" задан некорректно`
         );
      }
      try {
         const indexExpression = indexString !== null ? useIdentifierAlias(indexString) : null;
         index = indexExpression ? this.expressionParser.parse(indexExpression) : null;
      } catch (error) {
         throw new Error(
            `индекс цикла "${indexString}" задан некорректно`
         );
      }
      try {
         collection = this.expressionParser.parse(collectionExpression);
      } catch (error) {
         throw new Error(
            `коллекция цикла "${collectionExpression}" задана некорректно`
         );
      }
      return {
         iterator,
         index,
         collection
      };
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
         this.errorHandler.critical(
            `Ошибка разбора компонента "${node.name}": ${error.message}`,
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
      if (!node.isSelfClosing && this.warnEmptyComponentContent) {
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
      const componentContext: ITraverseContext = {
         ...context,
         state: TraverseState.COMPONENT_WITH_UNKNOWN_CONTENT,
         componentPropertyPath: '',
         componentPath: Resolvers.parseComponentName(node.name).getFullPath()
      };
      const options = this.getComponentOrPartialOptions(node.children, componentContext);
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
      const attributeProcessorOptions = {
         fileName: context.fileName,
         hasAttributesOnly: false,
         parentTagName: node.name,
         translationsRegistrar: context.scope
      };
      const path = Resolvers.parseComponentName(node.name);
      context.scope.registerDependency(path);
      const componentDescription = this.textTranslator.getComponentDescription(path.getFullPath());
      const attributes = this.attributeProcessor.process(
         node.attributes,
         attributeProcessorOptions,
         componentDescription
      );
      return new Ast.ComponentNode(
         path,
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
         this.errorHandler.critical(
            `Ошибка разбора директивы "ws:partial": ${error.message}`,
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
      if (!node.isSelfClosing && this.warnEmptyComponentContent) {
         this.errorHandler.warn(
            `Для директивы "ws:partial" не задан контент и тег компонента не указан как самозакрывающийся`,
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
      const componentContext: ITraverseContext = {
         ...context,
         state: TraverseState.COMPONENT_WITH_UNKNOWN_CONTENT,
         // TODO: Do it better
         componentPropertyPath: node.attributes.template ? node.attributes.template.value : ''
      };
      const options = this.getComponentOrPartialOptions(node.children, componentContext);
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
         parentTagName: node.name,
         translationsRegistrar: context.scope
      };
      // TODO: Do it better
      const componentDescription = this.textTranslator.getComponentDescription(node.attributes.template ? node.attributes.template.value : '');
      const attributes = this.attributeProcessor.process(node.attributes, attributeProcessorOptions, componentDescription);
      const template = validatePartialTemplate(attributes.options.template, node);
      delete attributes.options.template;
      if (!template) {
         throw new Error('не задано обязательное значение опции "template"');
      }
      if (template instanceof ProgramNode) {
         return new Ast.DynamicPartialNode(template, attributes.attributes, attributes.events, attributes.options);
      }
      if (Resolvers.isLogicalPath(template) || Resolvers.isPhysicalPath(template)) {
         const path = Resolvers.parseTemplatePath(template);
         context.scope.registerDependency(path);
         return new Ast.StaticPartialNode(path, attributes.attributes, attributes.events, attributes.options);
      }
      // TODO: Validate inline template name
      const inlineTemplate = new Ast.InlineTemplateNode(template, attributes.attributes, attributes.events, attributes.options);
      if (!context.scope.hasTemplate(template)) {
         throw new Error(`шаблон с именем "${template}" не был определен`);
      }
      return inlineTemplate;
   }

   // </editor-fold>

   // <editor-fold desc="Machine helpers">

   /**
    * Process component or partial node children.
    * @private
    * @param children {Node[]} Collection of child nodes of processing component or partial node.
    * @param context {ITraverseContext} Processing context.
    * @returns {<OptionNode | ContentOptionNode>} Returns collection of options and content options.
    */
   private getComponentOrPartialOptions(children: Nodes.Node[], context: ITraverseContext): Array<Ast.OptionNode | Ast.ContentOptionNode> {
      const content = this.visitAll(children, context);
      if (isFirstChildContent(content)) {
         const contentOption = new Ast.ContentOptionNode(
            'content',
            <Ast.TContent[]>content
         );
         contentOption.setFlag(Ast.Flags.NEST_CASTED);
         return [
            contentOption
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
               `Опция "${child.__$ws_name}" уже определена на теге "${node.name}"`,
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
         parentTagName: node.name,
         translationsRegistrar: context.scope
      });
      try {
         const textValue = this.textProcessor.process(
            dataValue,
            {
               fileName: context.fileName,
               translateText: false,
               allowedContent,
               position: node.position,
               translationsRegistrar: context.scope
            }
         );
         if (textValue.length !== 1) {
            this.errorHandler.warn(
               `Атрибут "${attribute}" тега "${node.name}" содержит некорректное значение. Ожидалось значение 1 типа, получена последовательность из ${textValue.length} значений`,
               {
                  fileName: context.fileName
               }
            );
         }
         return textValue[0];
      } catch (error) {
         throw new Error(`в атрибуте "${attribute}" ${error.message}`);
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
         this.errorHandler.error(
            `Обнаружен непредусмотренный атрибут "${name}" на теге "${parent.name}". Атрибут будет проигнорирован, его необходимо убрать`,
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
         this.errorHandler.error(
            `Обнаружен непредусмотренный атрибут "${name}" на теге "${nodeName}". Атрибут будет проигнорирован, его необходимо убрать`,
            {
               fileName: context.fileName,
               position: attributes[name].position
            }
         );
      }
   }

   private validateForbiddenDataTypeNode(node: Nodes.Tag, context: ITraverseContext): boolean {
      switch (node.name) {
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
            this.errorHandler.critical(
               `Использование директив типа данных разрешено только внутри опции и массива. Обнаружена директива типа данных "${node.name}"`,
               {
                  fileName: context.fileName,
                  position: node.position
               }
            );
            return true;
      }
      return false;
   }

   // </editor-fold>
}
