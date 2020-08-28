/// <amd-module name="UI/_builder/Tmpl/core/Ast" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Ast.ts
 */

import { ProgramNode } from '../expressions/_private/Nodes';

// tslint:disable:max-classes-per-file
// Намеренно отключаю правило max-classes-per-file

/**
 * TODO: все новые поля на время разработки именуются с префиксом __$ws_.
 *   Это делается для устранения коллизий при поддержании совместимости.
 *   После окончания разработки привести имена в нормальный вид.
 */

/**
 * Visitor interface for abstract syntax nodes tree.
 */
export interface IAstVisitor {

   /**
    * Visit attribute node.
    * @param node {AttributeNode} Concrete attribute node.
    * @param context {*} Concrete visitor context.
    */
   visitAttribute(node: AttributeNode, context: any): any;

   /**
    * Visit option node.
    * @param node {OptionNode} Concrete option node.
    * @param context {*} Concrete visitor context.
    */
   visitOption(node: OptionNode, context: any): any;

   /**
    * Visit content option node.
    * @param node {ContentOptionNode} Concrete content option node.
    * @param context {*} Concrete visitor context.
    */
   visitContentOption(node: ContentOptionNode, context: any): any;

   /**
    * Visit bind node.
    * @param node {BindNode} Concrete bind node.
    * @param context {*} Concrete visitor context.
    */
   visitBind(node: BindNode, context: any): any;

   /**
    * Visit event handler node.
    * @param node {EventNode} Concrete event handler node.
    * @param context {*} Concrete visitor context.
    */
   visitEvent(node: EventNode, context: any): any;

   /**
    * Visit element node.
    * @param node {ElementNode} Concrete element node.
    * @param context {*} Concrete visitor context.
    */
   visitElement(node: ElementNode, context: any): any;

   /**
    * Visit doctype node.
    * @param node {DoctypeNode} Concrete doctype node.
    * @param context {*} Concrete visitor context.
    */
   visitDoctype(node: DoctypeNode, context: any): any;

   /**
    * Visit CData section node.
    * @param node {CDataNode} Concrete CData section node.
    * @param context {*} Concrete visitor context.
    */
   visitCData(node: CDataNode, context: any): any;

   /**
    * Visit instruction node.
    * @param node {InstructionNode} Concrete instruction node.
    * @param context {*} Concrete visitor context.
    */
   visitInstruction(node: InstructionNode, context: any): any;

   /**
    * Visit comment node.
    * @param node {CommentNode} Concrete comment node.
    * @param context {*} Concrete visitor context.
    */
   visitComment(node: CommentNode, context: any): any;

   /**
    * Visit component node.
    * @param node {ComponentNode} Concrete component node.
    * @param context {*} Concrete visitor context.
    */
   visitComponent(node: ComponentNode, context: any): any;

   /**
    * Visit partial template node.
    * @param node {PartialNode} Concrete partial template node.
    * @param context {*} Concrete visitor context.
    */
   visitPartial(node: PartialNode, context: any): any;

   /**
    * Visit template node.
    * @param node {TemplateNode} Concrete template node.
    * @param context {*} Concrete visitor context.
    */
   visitTemplate(node: TemplateNode, context: any): any;

   /**
    * Visit conditional "if" node.
    * @param node {IfNode} Concrete conditional "if" node.
    * @param context {*} Concrete visitor context.
    */
   visitIf(node: IfNode, context: any): any;

   /**
    * Visit conditional "else" node.
    * @param node {ElseNode} Concrete conditional "else" node.
    * @param context {*} Concrete visitor context.
    */
   visitElse(node: ElseNode, context: any): any;

   /**
    * Visit "for" cycle node.
    * @param node {ForNode} Concrete "for" cycle node.
    * @param context {*} Concrete visitor context.
    */
   visitFor(node: ForNode, context: any): any;

   /**
    * Visit "foreach" cycle node.
    * @param node {ForeachNode} Concrete "foreach" cycle node.
    * @param context {*} Concrete visitor context.
    */
   visitForeach(node: ForeachNode, context: any): any;

   /**
    * Visit array data node.
    * @param node {ArrayNode} Concrete array data node.
    * @param context {*} Concrete visitor context.
    */
   visitArray(node: ArrayNode, context: any): any;

   /**
    * Visit boolean data node.
    * @param node {BooleanNode} Concrete boolean data node.
    * @param context {*} Concrete visitor context.
    */
   visitBoolean(node: BooleanNode, context: any): any;

   /**
    * Visit function data node.
    * @param node {FunctionNode} Concrete function data node.
    * @param context {*} Concrete visitor context.
    */
   visitFunction(node: FunctionNode, context: any): any;

   /**
    * Visit number data node.
    * @param node {NumberNode} Concrete number data node.
    * @param context {*} Concrete visitor context.
    */
   visitNumber(node: NumberNode, context: any): any;

   /**
    * Visit object data node.
    * @param node {ObjectNode} Concrete object data node.
    * @param context {*} Concrete visitor context.
    */
   visitObject(node: ObjectNode, context: any): any;

   /**
    * Visit string data node.
    * @param node {StringNode} Concrete string data node.
    * @param context {*} Concrete visitor context.
    */
   visitString(node: StringNode, context: any): any;

   /**
    * Visit value data node.
    * @param node {ValueNode} Concrete value data node.
    * @param context {*} Concrete visitor context.
    */
   visitValue(node: ValueNode, context: any): any;

   /**
    * Visit shared text node.
    * @param node {TextNode} Concrete shared text node.
    * @param context {*} Concrete visitor context.
    */
   visitText(node: TextNode, context: any): any;

   /**
    * Visit text data node.
    * @param node {TextDataNode} Concrete text data node.
    * @param context {*} Concrete visitor context.
    */
   visitTextData(node: TextDataNode, context: any): any;

   /**
    * Visit mustache expression node.
    * @param node {ExpressionNode} Concrete mustache expression node.
    * @param context {*} Concrete visitor context.
    */
   visitExpression(node: ExpressionNode, context: any): any;

   /**
    * Visit translation node.
    * @param node {TranslationNode} Concrete translation node.
    * @param context {*} Concrete visitor context.
    */
   visitTranslation(node: TranslationNode, context: any): any;
}

// <editor-fold desc="Wasaby tree types">

/**
 * Wasaby text representation type.
 */
export declare type TText = ExpressionNode
   | TextDataNode
   | TranslationNode;

/**
 * Check if node is type of Wasaby text types.
 * @param node {Ast} Wasaby abstract syntax node.
 */
export function isTypeofText(node: Ast): boolean {
   return node instanceof ExpressionNode ||
      node instanceof TextDataNode ||
      node instanceof TranslationNode;
}

/**
 * Wasaby directives type.
 */
export declare type TWasaby = TemplateNode
   | PartialNode
   | ComponentNode
   | IfNode
   | ElseNode
   | ForNode
   | ForeachNode;

/**
 * Check if node is type of Wasaby directive types.
 * @param node {Ast} Wasaby abstract syntax node.
 */
export function isTypeofWasaby(node: Ast): boolean {
   return node instanceof TemplateNode ||
      node instanceof PartialNode ||
      node instanceof ComponentNode ||
      node instanceof IfNode ||
      node instanceof ElseNode ||
      node instanceof ForNode ||
      node instanceof ForeachNode;
}

/**
 * Html node type.
 */
export declare type THtml = ElementNode
   | DoctypeNode
   | CDataNode
   | InstructionNode
   | CommentNode
   | TextNode;

/**
 * Check if node is type of HTML.
 * @param node {Ast} Wasaby abstract syntax node.
 */
export function isTypeofHtml(node: Ast): boolean {
   return node instanceof ElementNode ||
      node instanceof DoctypeNode ||
      node instanceof CDataNode ||
      node instanceof InstructionNode ||
      node instanceof CommentNode ||
      node instanceof TextNode;
}

/**
 * Content representation type.
 */
export declare type TContent = TWasaby
   | THtml;


/**
 * Check if node is type of content.
 * @param node {Ast} Wasaby abstract syntax node.
 */
export function isTypeofContent(node: Ast): boolean {
   return isTypeofWasaby(node) || isTypeofHtml(node);
}

/**
 * Wasaby data representation type.
 */
export declare type TData = ArrayNode
   | BooleanNode
   | FunctionNode
   | NumberNode
   | ObjectNode
   | StringNode
   | ValueNode;

/**
 * Check if node is type of Wasaby data type.
 * @param node {Ast} Wasaby abstract syntax node.
 */
export function isTypeofData(node: Ast): boolean {
   return node instanceof ArrayNode ||
      node instanceof BooleanNode ||
      node instanceof FunctionNode ||
      node instanceof NumberNode ||
      node instanceof ObjectNode ||
      node instanceof StringNode ||
      node instanceof ValueNode;
}

// </editor-fold>

// <editor-fold desc="Base interfaces and classes">

/**
 * Ast node flags.
 */
export enum Flags {

   /**
    * Flag for node that has been validated.
    */
   CLEAN = 0,

   /**
    * Flag for broken node that should be ignored.
    */
   BROKEN = 1,

   /**
    * Flag for unpacked node that has been changed its view.
    */
   UNPACKED = 4,

   /**
    * Flag for type casted node that has been changed its view.
    */
   TYPE_CASTED = 8,

   /**
    * Flag for node that must be ignored in next processing.
    */
   IGNORE = 16
}

/**
 * Declares abstract class for node of abstract syntax tree.
 */
export abstract class Ast {

   /**
    * Abstract syntax node key in the abstract syntax tree.
    */
   __$ws_key: string;

   /**
    * Processing flags.
    */
   __$ws_flags: Flags;

   /**
    * Initialize new instance of abstract syntax node.
    */
   protected constructor() {
      this.__$ws_key =  '';
      this.__$ws_flags = Flags.CLEAN;
   }

   /**
    * Check if abstract syntax node has processing flag.
    * @param flag {Flags} Concrete processing flag.
    */
   hasFlag(flag: Flags): boolean {
      return (this.__$ws_flags & flag) !== 0;
   }

   /**
    * Set processing flag.
    * @param flag {Flags} Concrete processing flag.
    */
   setFlag(flag: Flags): void {
      this.__$ws_flags = this.__$ws_flags | flag;
   }

   /**
    * Accept visitor for abstract syntax node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   abstract accept(visitor: IAstVisitor, context: any): any;
}

/**
 * Abstract class for node of abstract syntax tree that
 * contains attributes and event handlers.
 */
export abstract class BaseHtmlElement extends Ast {

   /**
    * Collection of abstract syntax node attributes.
    */
   __$ws_attributes: IAttributes;

   /**
    * Collection of abstract syntax node event handlers.
    */
   __$ws_events: IEvents;

   /**
    * Initialize new instance of abstract syntax node.
    */
   protected constructor() {
      super();
      this.__$ws_attributes = { };
      this.__$ws_events = { };
   }
}

/**
 * Abstract class for node of abstract syntax tree that
 * contains options and contents.
 */
export abstract class BaseWasabyElement extends BaseHtmlElement {

   /**
    * Collection of abstract syntax node options.
    */
   __$ws_options: IOptions;

   /**
    * Collection of abstract syntax node contents.
    */
   __$ws_contents: IContents;

   /**
    * Initialize new instance of abstract syntax node.
    */
   protected constructor() {
      super();
      this.__$ws_options = { };
      this.__$ws_contents = { };
   }

   /**
    * Append content node to content option.
    * @param name {string} Content option name.
    * @param ast {TContent} Content node.
    */
   appendToContent(name: string, ast: TContent): void {
      this.initializeContent(name);
      this.__$ws_contents[name].push(ast);
   }

   /**
    * Initialize content option.
    * @param name {string} Content option name.
    */
   private initializeContent(name: string): void {
      if (!this.__$ws_contents.hasOwnProperty(name)) {
         this.__$ws_contents[name] = new ContentOptionNode(name, []);
      }
   }
}

// </editor-fold>

// <editor-fold desc="Attributes">

/**
 * Represents abstract syntax node for attribute.
 *
 * ```
 *    ...
 *    <htmlElement
 *       attribute="value" >
 *       ...
 *    <htmlElement>
 *    ...
 *    ...
 *    <component
 *       attr:attribute="value" >
 *       ...
 *    <component>
 *    ...
 * ```
 */
export class AttributeNode extends Ast {

   /**
    * Attribute name.
    */
   __$ws_name: string;

   /**
    * Attribute value.
    */
   __$ws_value: TText[];

   /**
    * Initialize new instance of attribute node.
    * @param name {string} Attribute name.
    * @param value {TText[]} Attribute value.
    */
   constructor(name: string, value: TText[]) {
      super();
      this.__$ws_name = name;
      this.__$ws_value = value;
   }

   /**
    * Accept visitor for attribute node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitAttribute(this, context);
   }
}

/**
 * Represents node for simple option.
 *
 * ```
 *    ...
 *    <component
 *       option="value" >
 *       ...
 *    <component>
 *    ...
 *    <component>
 *       <ws:option>
 *          value
 *       </ws:option>
 *    <component>
 *    ...
 * ```
 */
export class OptionNode extends Ast {

   /**
    * Option name.
    */
   __$ws_name: string;

   /**
    * Option value.
    */
   __$ws_value: TData;


   /**
    * Initialize new instance of option node.
    * @param name {string} Option name.
    * @param value {TData} Option value.
    */
   constructor(name: string, value: TData) {
      super();
      this.__$ws_name = name;
      this.__$ws_value = value;
   }

   /**
    * Accept visitor for option node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitOption(this, context);
   }
}

/**
 * Represents abstract syntax node for content node option or root content of ws:partial or Component.
 *
 * ```
 *    ...
 *    <component>
 *       content
 *    <component>
 *    ...
 *    <component>
 *       <ws:content>
 *          content
 *       </ws:content>
 *    <component>
 *    ...
 *    <component>
 *       <ws:contentOption>
 *          content
 *       </ws:contentOption>
 *    <component>
 *    ...
 * ```
 */
export class ContentOptionNode extends Ast {

   /**
    * Content option name.
    */
   __$ws_name: string;

   /**
    * Collection of content nodes.
    */
   __$ws_content: TContent[];

   /**
    * Initialize new instance of content option node.
    * @param name {string} Content option name.
    * @param content {TContent} Collection of content nodes.
    */
   constructor(name: string, content: TContent[]) {
      super();
      this.__$ws_name = name;
      this.__$ws_content = content;
   }

   /**
    * Accept visitor for content option node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitContentOption(this, context);
   }

   /**
    * Append content node.
    * @param ast {TContent} content node.
    */
   push(ast: TContent): void {
      this.__$ws_content.push(ast);
   }
}


/**
 * Represents node for binding expression.
 *
 * ```
 *    ...
 *    bind:option="otherOption"
 *    ...
 * ```
 */
export class BindNode extends Ast {

   /**
    * Binding property name.
    */
   __$ws_property: string;

   /**
    * Target property name or expression.
    */
   __$ws_value: ProgramNode;

   /**
    * Initialize new instance of binding expression node.
    * @param property {string} Binding property name.
    * @param value {ProgramNode} Target property name or expression.
    */
   constructor(property: string, value: ProgramNode) {
      super();
      this.__$ws_property = property;
      this.__$ws_value = value;
   }

   /**
    * Accept visitor for binding expression node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitBind(this, context);
   }
}

/**
 * Represents node for event handlers.
 *
 * ```
 *    ...
 *    on:eventName="handler(...arguments)"
 *    ...
 * ```
 */
export class EventNode extends Ast {

   /**
    * Event name.
    */
   __$ws_event: string;

   /**
    * Event handler.
    */
   __$ws_handler: ProgramNode;

   /**
    * Initialize new instance of event handler node.
    * @param event {string} Event name.
    * @param handler {ProgramNode} Event handler.
    */
   constructor(event: string, handler: ProgramNode) {
      super();
      this.__$ws_event = event;
      this.__$ws_handler = handler;
   }

   /**
    * Accept visitor for event handler node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitEvent(this, context);
   }
}

/**
 * Interface for attributes collection.
 */
export interface IAttributes {
   [attribute: string]: AttributeNode;
}

/**
 * Interface for options collection.
 */
export interface IOptions {
   [attribute: string]: OptionNode;
}

/**
 * Interface for content options collection.
 */
export interface IContents {
   [attribute: string]: ContentOptionNode;
}

/**
 * Interface for event handlers collection.
 */
export interface IEvents {
   [attribute: string]: EventNode | BindNode;
}

// </editor-fold>

// <editor-fold desc="Native HTML nodes">

/**
 * Represents node for element tag.
 *
 * ```
 *    <element attribute="value" on:event="handler">
 *       content
 *    </element>
 * ```
 */
export class ElementNode extends BaseHtmlElement {

   /**
    * Element name.
    */
   __$ws_name: string;

   /**
    * Element content.
    */
   __$ws_content: TContent[];

   /**
    * Initialize new instance of element node.
    * @param name {string} Element name.
    */
   constructor(name: string) {
      super();
      this.__$ws_name = name;
      this.__$ws_content = [];
   }

   /**
    * Accept visitor for element node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitElement(this, context);
   }
}

/**
 * Represents node for doctype declaration.
 *
 * ```
 *    <!DOCTYPE content>
 * ```
 */
export class DoctypeNode extends Ast {

   /**
    * Doctype declaration text.
    */
   __$ws_data: string;

   /**
    * Initialize new instance of doctype declaration node.
    * @param data {string} Doctype declaration text.
    */
   constructor(data: string) {
      super();
      this.__$ws_data = data;
   }

   /**
    * Accept visitor for doctype declaration node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitDoctype(this, context);
   }
}

/**
 * Represents node for CData declaration.
 *
 * ```
 *    <![CDATA[ data ]]>
 * ```
 */
export class CDataNode extends Ast {

   /**
    * CData declaration data.
    */
   __$ws_data: string;

   /**
    * Initialize new instance of CData declaration node.
    * @param data {string} CData declaration data.
    */
   constructor(data: string) {
      super();
      this.__$ws_data = data;
   }

   /**
    * Accept visitor for CData declaration node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitCData(this, context);
   }
}

/**
 * Represents node for instruction.
 *
 * ```
 *    <? data ?>
 * ```
 */
export class InstructionNode extends Ast {

   /**
    * Instruction data.
    */
   __$ws_data: string;

   /**
    * Initialize new instance of instruction node.
    * @param data {string} Instruction data.
    */
   constructor(data: string) {
      super();
      this.__$ws_data = data;
   }

   /**
    * Accept visitor for instruction node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitInstruction(this, context);
   }
}

/**
 * Represents node for comment.
 *
 * ```
 *    <!-- data -->
 * ```
 */
export class CommentNode extends Ast {

   /**
    * Comment data.
    */
   __$ws_data: string;

   /**
    * Initialize new instance of comment node.
    * @param data {string} Comment data.
    */
   constructor(data: string) {
      super();
      this.__$ws_data = data;
   }

   /**
    * Accept visitor for comment node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitComment(this, context);
   }
}

// </editor-fold>

// <editor-fold desc="Wasaby directives">

/**
 * Represents node for component tag.
 *
 * ```
 *    <componentName attr:name="value" on:event="handler" option="value">
 *       content
 *    </componentName>
 * ```
 */
export class ComponentNode extends BaseWasabyElement {

   /**
    * Path to component module or library.
    */
   __$ws_library: string[];

   /**
    * Path to component class inside library.
    */
   __$ws_module: string[];

   /**
    * Initialize new instance of component node.
    * @param library {string[]} Path to component module or library.
    * @param module {string[]} Path to component class inside library.
    */
   constructor(library: string[], module: string[]) {
      super();
      this.__$ws_library = library;
      this.__$ws_module = module;
   }

   /**
    * Accept visitor for component node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitComponent(this, context);
   }

   /**
    * Set option or content option on component.
    * @param option {OptionNode | ContentOptionNode} Option or content option node.
    */
   setOption(option: OptionNode | ContentOptionNode): void {
      const name = option.__$ws_name;
      if (this.hasOption(name)) {
         throw new Error(`Опция ${name} уже существует на компоненте`);
      }
      if (option instanceof OptionNode) {
         this.__$ws_options[name] = option;
         return;
      }
      if (option instanceof ContentOptionNode) {
         this.__$ws_contents[name] = option;
         return;
      }
      throw new Error(
         `Произведена попытка установки опции ${name} недопустимого типа ${(<Ast>option).constructor.name}`
      );
   }

   /**
    * Check if component already has option or component option.
    * @param name {string} Option or component option name.
    */
   hasOption(name: string): boolean {
      return this.__$ws_options.hasOwnProperty(name) || this.__$ws_contents.hasOwnProperty(name);
   }
}

/**
 * Represents node for ws:partial tag.
 *
 * ```
 *    <ws:partial template="name">
 *       content
 *    </ws:partial>
 * ```
 */
export class PartialNode extends BaseWasabyElement {

   /**
    * Partial template name or expression.
    */
   __$ws_name: string | ProgramNode;

   /**
    * Initialize new instance of partial node.
    * @param name {string | ProgramNode} Partial template name or expression.
    */
   constructor(name: string | ProgramNode) {
      super();
      this.__$ws_name = name;
   }

   /**
    * Accept visitor for partial node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitPartial(this, context);
   }
}

/**
 * Represents node for ws:template tag.
 *
 * ```
 *    <ws:template name="templateName">
 *       content
 *    </ws:template>
 * ```
 */
export class TemplateNode extends Ast {

   /**
    * Template name.
    */
   __$ws_name: string;

   /**
    * Template content.
    */
   __$ws_content: TContent[];

   /**
    * Initialize new instance of template node.
    * @param name {string} Template name.
    * @param content {TContent[]} Template content.
    */
   constructor(name: string, content: TContent[] = []) {
      super();
      this.__$ws_name = name;
      this.__$ws_content = content;
   }

   /**
    * Accept visitor for template node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitTemplate(this, context);
   }
}

/**
 * Represents node for conditional ws:if tag.
 *
 * ```
 *    <ws:if data="{{ expression }}">
 *       content
 *    </ws:if>
 * ```
 */
export class IfNode extends Ast {

   /**
    * Test expression.
    */
   __$ws_test: ProgramNode;

   /**
    * Consequent content nodes.
    */
   __$ws_consequent: TContent[];

   /**
    * Alternate conditional node.
    */
   __$ws_alternate: ElseNode | null;

   /**
    * Initialize new instance of conditional node.
    * @param test {ProgramNode} Test expression.
    */
   constructor(test: ProgramNode) {
      super();
      this.__$ws_test = test;
      this.__$ws_consequent = [];
      this.__$ws_alternate = null;
   }

   /**
    * Accept visitor for conditional node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitIf(this, context);
   }
}

/**
 * Represents node for conditional ws:else tag.
 *
 * ```
 *    <ws:else data="expression">
 *       content
 *    </ws:else>
 * ```
 */
export class ElseNode extends Ast {

   /**
    * Consequent content nodes.
    */
   __$ws_consequent: TContent[];

   /**
    * Test expression. If not empty then node equals to "else if".
    */
   __$ws_test: ProgramNode | null;

   /**
    * Alternate conditional node.
    */
   __$ws_alternate: ElseNode | null;

   /**
    * Initialize new instance of conditional node.
    */
   constructor() {
      super();
      this.__$ws_consequent = [];
      this.__$ws_test = null;
      this.__$ws_alternate = null;
   }

   /**
    * Accept visitor for conditional node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitElse(this, context);
   }

   /**
    * Check if conditional node is else-if node.
    */
   isElif(): boolean {
      return this.__$ws_test !== null;
   }
}

/**
 * Represents node for ws:for.
 *
 * ```
 *    <ws:for data="init; test; update">
 *       content
 *    </ws:for>
 * ```
 */
export class ForNode extends Ast {

   /**
    * Initialize expression.
    */
   __$ws_init: ProgramNode | null;

   /**
    * Required test expression.
    */
   __$ws_test: ProgramNode;

   /**
    * Update expression.
    */
   __$ws_update: ProgramNode | null;

   /**
    * Content nodes.
    */
   __$ws_content: TContent[];

   /**
    * Initialize new instance of cycle node.
    * @param init {ProgramNode | null} Initialize expression.
    * @param test {ProgramNode} Required test expression.
    * @param update {ProgramNode | null} Update expression.
    */
   constructor(init: ProgramNode | null, test: ProgramNode, update: ProgramNode | null) {
      super();
      this.__$ws_init = init;
      this.__$ws_test = test;
      this.__$ws_update = update;
      this.__$ws_content = [];
   }

   /**
    * Accept visitor for cycle node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitFor(this, context);
   }
}

/**
 * Represents node for ws:for.
 *
 * ```
 *    <ws:foreach data="[index, ] iterator in collection">
 *       content
 *    </ws:foreach>
 * ```
 */
export class ForeachNode extends Ast {

   /**
    * Name of iterator indexer.
    */
   __$ws_index: string | null;

   /**
    * Name of iterator.
    */
   __$ws_iterator: string;

   /**
    * Collection expression.
    */
   __$ws_collection: ProgramNode;

   /**
    * Content nodes.
    */
   __$ws_content: TContent[];

   /**
    * Initialize new instance of cycle node.
    * @param index {string | null} Name of iterator.
    * @param iterator {string} Collection expression.
    * @param collection {ProgramNode} Collection expression.
    */
   constructor(index: string | null, iterator: string, collection: ProgramNode) {
      super();
      this.__$ws_index = index;
      this.__$ws_iterator = iterator;
      this.__$ws_collection = collection;
      this.__$ws_content = [];
   }

   /**
    * Accept visitor for cycle node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitForeach(this, context);
   }
}

// </editor-fold>

// <editor-fold desc="WaSaby data directives">

/**
 * Represents node for ws:Array tag.
 *
 * ```
 *    <ws:Array>
 *       elements
 *    </ws:Array>
 * ```
 */
export class ArrayNode extends Ast {

   /**
    * Array elements.
    */
   __$ws_elements: TData[];

   /**
    * Initialize new instance of array node.
    * @param elements {TData[]} Array elements.
    */
   constructor(elements: TData[] = []) {
      super();
      this.__$ws_elements = elements;
   }

   /**
    * Accept visitor for array node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitArray(this, context);
   }
}

/**
 * Represents node for ws:Boolean tag.
 *
 * ```
 *    <ws:Boolean>
 *       content
 *    </ws:Boolean>
 * ```
 */
export class BooleanNode extends Ast {

   /**
    * Data of boolean type.
    */
   __$ws_data: TText[];

   /**
    * Initialize new instance of boolean node.
    * @param data {TText[]} Data of boolean type.
    */
   constructor(data: TText[]) {
      super();
      this.__$ws_data = data;
   }

   /**
    * Accept visitor for abstract boolean node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitBoolean(this, context);
   }
}

/**
 * Represents node for ws:Function tag.
 *
 * ```
 *    <ws:Function>
 *       content
 *    </ws:Function>
 * ```
 */
export class FunctionNode extends Ast {

   /**
    * Data representation.
    */
   __$ws_data: string;

   // TODO: describe!!!

   /**
    * Initialize new instance of function node.
    * @param data {string} Data representation.
    */
   constructor(data: string) {
      super();
      this.__$ws_data = data;
   }

   /**
    * Accept visitor for abstract function node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitFunction(this, context);
   }
}

/**
 * Represents node for ws:Number tag.
 *
 * ```
 *    <ws:Number>
 *       content
 *    </ws:Number>
 * ```
 */
export class NumberNode extends Ast {

   /**
    * Data representation.
    */
   __$ws_data: TText[];

   /**
    * Initialize new instance of number node.
    * @param data {string} Data representation.
    */
   constructor(data: TText[]) {
      super();
      this.__$ws_data = data;
   }

   /**
    * Accept visitor for number node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitNumber(this, context);
   }
}

/**
 * Interface of object node properties.
 */
export interface IObjectProperties {
   [name: string]: OptionNode | ContentOptionNode;
}

/**
 * Represents node for ws:Object tag.
 *
 * ```
 *    <ws:Object>
 *       <ws:property>
 *          content
 *       </ws:property>
 *    </ws:Object>
 * ```
 */
export class ObjectNode extends Ast {

   /**
    * Collection of object properties.
    */
   __$ws_properties: IObjectProperties;

   /**
    * Initialize new instance of object node.
    * @param properties {IObjectProperties} Collection of object properties.
    */
   constructor(properties: IObjectProperties) {
      super();
      this.__$ws_properties = properties;
   }

   /**
    * Accept visitor for object node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitObject(this, context);
   }
}

/**
 * Represents node for ws:String tag.
 *
 * ```
 *    <ws:String>
 *       content
 *    </ws:String>
 * ```
 */
export class StringNode extends Ast {

   /**
    * Data representation.
    */
   __$ws_data: TText[];

   /**
    * Initialize new instance of string node.
    * @param data {TText[]} Data representation.
    */
   constructor(data: TText[]) {
      super();
      this.__$ws_data = data;
   }

   /**
    * Accept visitor for string node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitString(this, context);
   }
}

/**
 * Represents node for ws:Value tag.
 *
 * ```
 *    <ws:Value>
 *       content
 *    </ws:Value>
 * ```
 */
export class ValueNode extends Ast {

   /**
    * Data representation.
    */
   __$ws_data: TText[];

   /**
    * Initialize new instance of value node.
    * @param data {TText[]} Data representation.
    */
   constructor(data: TText[]) {
      super();
      this.__$ws_data = data;
   }

   /**
    * Accept visitor for value node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitValue(this, context);
   }
}

// </editor-fold>

// <editor-fold desc="Wasaby text">

/**
 * Represents node for shared text that includes text, translation and expression.
 */
export class TextNode extends Ast {

   /**
    * Text content.
    */
   __$ws_content: TText[];

   /**
    * Initialize new instance of shared text node.
    * @param content {TText[]} Text content.
    */
   constructor(content: TText[] = []) {
      super();
      this.__$ws_content = content;
   }

   /**
    * Accept visitor for shared text node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitText(this, context);
   }
}

/**
 * Represents node for text.
 */
export class TextDataNode extends Ast {

   /**
    * Text content.
    */
   __$ws_content: string;

   /**
    * Initialize new instance of text node.
    * @param content {string} Text content.
    */
   constructor(content: string = '') {
      super();
      this.__$ws_content = content;
   }

   /**
    * Accept visitor for text node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitTextData(this, context);
   }
}

/**
 * Represents node for mustache expression.
 *
 * ```
 *    {{ javascript expression }}
 * ```
 */
export class ExpressionNode extends Ast {

   /**
    * Program node of mustache expression.
    */
   __$ws_program: ProgramNode;

   /**
    * Initialize new instance of mustache expression node.
    * @param program
    */
   constructor(program: ProgramNode) {
      super();
      this.__$ws_program = program;
   }

   /**
    * Accept visitor for mustache expression node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitExpression(this, context);
   }
}

/**
 * Represents node for translatable text.
 *
 * ```
 *    {[ [ translation context @@ ] translatable text ]}
 * ```
 */
export class TranslationNode extends Ast {

   /**
    * Translatable text.
    */
   __$ws_text: string;

   /**
    * Translation context.
    */
   __$ws_context: string;

   /**
    * Initialize new instance of translation node.
    * @param text {string} Translatable text.
    * @param context {string} Translation context.
    */
   constructor(text: string, context: string = '') {
      super();
      this.__$ws_text = text;
      this.__$ws_context = context;
   }

   /**
    * Accept visitor for translation node.
    * @param visitor {IAstVisitor} Concrete visitor.
    * @param context {*} Concrete visitor context.
    */
   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitTranslation(this, context);
   }
}

// </editor-fold>
