/// <amd-module name="UI/_builder/Tmpl/core/Ast" />

/**
 * @author Крылов М.А.
 */

import { ProgramNode } from '../expressions/_private/Nodes';

// tslint:disable:max-classes-per-file
// Намеренно отключаю правило max-classes-per-file

/**
 * TODO: все новые поля на время разработки именуются с префиксом __$ws_.
 *   Это делается для устранения коллизий при поддержании совместимости.
 *   После окончания разработки привести имена в нормальный вид.
 */

export interface IAstVisitor {
   visitAttribute(node: AttributeNode, context: any): any;
   visitOption(node: OptionNode, context: any): any;
   visitContentOption(node: ContentOptionNode, context: any): any;
   visitBind(node: BindNode, context: any): any;
   visitEvent(node: EventNode, context: any): any;

   visitElement(node: ElementNode, context: any): any;
   visitDoctype(node: DoctypeNode, context: any): any;
   visitCData(node: CDataNode, context: any): any;
   visitInstruction(node: InstructionNode, context: any): any;
   visitComment(node: CommentNode, context: any): any;

   visitComponent(node: ComponentNode, context: any): any;
   visitPartial(node: PartialNode, context: any): any;
   visitTemplate(node: TemplateNode, context: any): any;
   visitIf(node: IfNode, context: any): any;
   visitElse(node: ElseNode, context: any): any;
   visitFor(node: ForNode, context: any): any;
   visitForeach(node: ForeachNode, context: any): any;

   visitArray(node: ArrayNode, context: any): any;
   visitBoolean(node: BooleanNode, context: any): any;
   visitFunction(node: FunctionNode, context: any): any;
   visitNumber(node: NumberNode, context: any): any;
   visitObject(node: ObjectNode, context: any): any;
   visitString(node: StringNode, context: any): any;
   visitValue(node: ValueNode, context: any): any;

   visitText(node: TextNode, context: any): any;
   visitTextData(node: TextDataNode, context: any): any;
   visitExpression(node: ExpressionNode, context: any): any;
   visitTranslation(node: TranslationNode, context: any): any;
}

// <editor-fold desc="Wasaby tree types">

export declare type TText = ExpressionNode
   | TextDataNode
   | TranslationNode;

export declare type TWasaby = TemplateNode
   | PartialNode
   | ComponentNode
   | IfNode
   | ElseNode
   | ForNode
   | ForeachNode;

export declare type THtml = ElementNode
   | DoctypeNode
   | CDataNode
   | InstructionNode
   | CommentNode
   | TextNode;

export declare type TContent = TWasaby
   | THtml;

export declare type TData = ArrayNode
   | BooleanNode
   | FunctionNode
   | NumberNode
   | ObjectNode
   | StringNode
   | ValueNode;

// </editor-fold>

// <editor-fold desc="Base interfaces and classes">

export abstract class Ast {
   __$ws_key: string;

   protected constructor() {
      this.__$ws_key = '';
   }

   abstract accept(visitor: IAstVisitor, context: any): any;
}

export abstract class BaseHtmlElement extends Ast {
   __$ws_attributes: IAttributes;
   __$ws_events: IEvents;

   protected constructor() {
      super();
      this.__$ws_attributes = { };
      this.__$ws_events = { };
   }
}

export abstract class BaseWasabyElement extends BaseHtmlElement {
   __$ws_options: IOptions;

   protected constructor() {
      super();
      this.__$ws_options = { };
   }
}

// </editor-fold>

// <editor-fold desc="Attributes">

export class AttributeNode extends Ast {
   __$ws_name: string;
   __$ws_value: TText[];

   constructor(name: string, value: TText[]) {
      super();
      this.__$ws_name = name;
      this.__$ws_value = value;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitAttribute(this, context);
   }
}

export class OptionNode extends Ast {
   __$ws_name: string;
   __$ws_value: TText[];

   constructor(name: string, value: TText[]) {
      super();
      this.__$ws_name = name;
      this.__$ws_value = value;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitOption(this, context);
   }
}

export class ContentOptionNode extends Ast {
   __$ws_name: string;
   __$ws_content: TContent[];

   constructor(name: string, content: TContent[]) {
      super();
      this.__$ws_name = name;
      this.__$ws_content = content;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitContentOption(this, context);
   }
}

export class BindNode extends Ast {
   __$ws_property: string;
   __$ws_value: ProgramNode;

   constructor(property: string, value: ProgramNode) {
      super();
      this.__$ws_property = property;
      this.__$ws_value = value;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitBind(this, context);
   }
}

export class EventNode extends Ast {
   __$ws_event: string;
   __$ws_handler: ProgramNode;

   constructor(event: string, handler: ProgramNode) {
      super();
      this.__$ws_event = event;
      this.__$ws_handler = handler;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitEvent(this, context);
   }
}

export interface IAttributes {
   [attribute: string]: AttributeNode;
}

export interface IOptions {
   [attribute: string]: OptionNode | ContentOptionNode;
}

export interface IEvents {
   [attribute: string]: EventNode | BindNode;
}

// </editor-fold>

// <editor-fold desc="Native HTML nodes">

export class ElementNode extends BaseHtmlElement {
   __$ws_name: string;
   __$ws_content: TContent[];

   constructor(name: string) {
      super();
      this.__$ws_name = name;
      this.__$ws_content = [];
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitElement(this, context);
   }
}

export class DoctypeNode extends Ast {
   __$ws_data: string;

   constructor(data: string) {
      super();
      this.__$ws_data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitDoctype(this, context);
   }
}

export class CDataNode extends Ast {
   __$ws_data: string;

   constructor(data: string) {
      super();
      this.__$ws_data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitCData(this, context);
   }
}

export class InstructionNode extends Ast {
   __$ws_data: string;

   constructor(data: string) {
      super();
      this.__$ws_data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitInstruction(this, context);
   }
}

export class CommentNode extends Ast {
   __$ws_data: string;

   constructor(data: string) {
      super();
      this.__$ws_data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitComment(this, context);
   }
}

// </editor-fold>

// <editor-fold desc="WaSaby directives">

export class ComponentNode extends BaseWasabyElement {
   __$ws_name: string;

   constructor(name: string) {
      super();
      this.__$ws_name = name;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitComponent(this, context);
   }
}

export class PartialNode extends BaseWasabyElement {
   __$ws_name: string | ProgramNode;

   constructor(name: string | ProgramNode) {
      super();
      this.__$ws_name = name;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitPartial(this, context);
   }
}

export class TemplateNode extends Ast {
   __$ws_name: string;
   __$ws_content: TContent[];

   constructor(name: string) {
      super();
      this.__$ws_name = name;
      this.__$ws_content = [];
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitTemplate(this, context);
   }
}

export class IfNode extends Ast {
   __$ws_test: ProgramNode;
   __$ws_consequent: TContent[];
   __$ws_alternate: ElseNode | null;

   constructor(test: ProgramNode) {
      super();
      this.__$ws_test = test;
      this.__$ws_consequent = [];
      this.__$ws_alternate = null;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitIf(this, context);
   }
}

export class ElseNode extends Ast {
   __$ws_consequent: TContent[];
   __$ws_test: ProgramNode | null;
   __$ws_alternate: ElseNode | null;

   constructor() {
      super();
      this.__$ws_consequent = [];
      this.__$ws_test = null;
      this.__$ws_alternate = null;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitElse(this, context);
   }
}

export class ForNode extends Ast {
   __$ws_init: ProgramNode | null;
   __$ws_test: ProgramNode;
   __$ws_update: ProgramNode | null;
   __$ws_content: TContent[];

   constructor(init: ProgramNode | null, test: ProgramNode, update: ProgramNode | null) {
      super();
      this.__$ws_init = init;
      this.__$ws_test = test;
      this.__$ws_update = update;
      this.__$ws_content = [];
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitFor(this, context);
   }
}

export class ForeachNode extends Ast {
   __$ws_index: string | null;
   __$ws_iterator: string;
   __$ws_collection: ProgramNode;
   __$ws_content: TContent[];

   constructor(index: string | null, iterator: string, collection: ProgramNode) {
      super();
      this.__$ws_index = index;
      this.__$ws_iterator = iterator;
      this.__$ws_collection = collection;
      this.__$ws_content = [];
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitForeach(this, context);
   }
}

// </editor-fold>

// <editor-fold desc="WaSaby data directives">

export class ArrayNode extends Ast {
   __$ws_elements: TData[];

   constructor(elements: TData[] = []) {
      super();
      this.__$ws_elements = elements;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitArray(this, context);
   }
}

export class BooleanNode extends Ast {
   __$ws_data: ProgramNode;

   constructor(data: ProgramNode) {
      super();
      this.__$ws_data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitBoolean(this, context);
   }
}

export class FunctionNode extends Ast {
   __$ws_data: string;

   // TODO: уточнить!!!

   constructor(data: string) {
      super();
      this.__$ws_data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitFunction(this, context);
   }
}

export class NumberNode extends Ast {
   __$ws_data: ProgramNode;

   constructor(data: ProgramNode) {
      super();
      this.__$ws_data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitNumber(this, context);
   }
}

export interface IObjectProperties {
   [name: string]: TData | TContent;
}

export class ObjectNode extends Ast {
   __$ws_properties: IObjectProperties;

   constructor(properties: IObjectProperties) {
      super();
      this.__$ws_properties = properties;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitObject(this, context);
   }
}

export class StringNode extends Ast {
   __$ws_data: ProgramNode;

   constructor(data: ProgramNode) {
      super();
      this.__$ws_data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitString(this, context);
   }
}

export class ValueNode extends Ast {
   __$ws_data: string;

   // TODO: уточнить!!!

   constructor(data: string) {
      super();
      this.__$ws_data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitValue(this, context);
   }
}

// </editor-fold>

// <editor-fold desc="WaSaby text">

export class TextNode extends Ast {
   __$ws_content: TText[];

   constructor(content: TText[] = []) {
      super();
      this.__$ws_content = content;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitText(this, context);
   }
}

export class TextDataNode extends Ast {
   __$ws_content: string;

   constructor(content: string = '') {
      super();
      this.__$ws_content = content;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitTextData(this, context);
   }
}

export class ExpressionNode extends Ast {
   __$ws_program: ProgramNode;

   constructor(program: ProgramNode) {
      super();
      this.__$ws_program = program;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitExpression(this, context);
   }
}

export class TranslationNode extends Ast {
   __$ws_text: string;
   __$ws_context: string;

   constructor(text: string, context: string = '') {
      super();
      this.__$ws_text = text;
      this.__$ws_context = context;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitTranslation(this, context);
   }
}

// </editor-fold>
