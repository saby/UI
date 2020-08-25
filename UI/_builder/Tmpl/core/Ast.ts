/// <amd-module name="UI/_builder/Tmpl/core/Ast" />

/**
 * @author Крылов М.А.
 */

export interface IAstVisitor {
   visitAttribute(node: AttributeNode, context: any): any;
   visitOption(node: OptionNode, context: any): any;
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

// <editor-fold desc="Base interfaces and classes">

export abstract class Ast {
   protected constructor() {
      //
   }

   abstract accept(visitor: IAstVisitor, context: any): any;
}

export abstract class BaseHtmlElement extends Ast {
   attributes: IAttributes;
   events: IEvents;

   protected constructor() {
      super();
   }
}

export abstract class BaseWasabyElement extends BaseHtmlElement {
   options: IOptions;

   protected constructor() {
      super();
   }
}

// </editor-fold>

// <editor-fold desc="Attributes">

export class AttributeNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitAttribute(this, context);
   }
}

export class OptionNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitOption(this, context);
   }
}

export class BindNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitBind(this, context);
   }
}

export class EventNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitEvent(this, context);
   }
}

export interface IAttributes {
   [attribute: string]: AttributeNode;
}

export interface IOptions {
   [attribute: string]: OptionNode;
}

export interface IEvents {
   [attribute: string]: Array<EventNode | BindNode>;
}

// </editor-fold>

// <editor-fold desc="Native HTML nodes">

export class ElementNode extends BaseHtmlElement {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitElement(this, context);
   }
}

export class DoctypeNode extends Ast {
   data: string;

   constructor(data: string) {
      super();
      this.data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitDoctype(this, context);
   }
}

export class CDataNode extends Ast {
   data: string;

   constructor(data: string) {
      super();
      this.data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitCData(this, context);
   }
}

export class InstructionNode extends Ast {
   data: string;

   constructor(data: string) {
      super();
      this.data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitInstruction(this, context);
   }
}

export class CommentNode extends Ast {
   data: string;

   constructor(data: string) {
      super();
      this.data = data;
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitComment(this, context);
   }
}

// </editor-fold>

// <editor-fold desc="WaSaby directives">

export class ComponentNode extends BaseWasabyElement {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitComponent(this, context);
   }
}

export class PartialNode extends BaseWasabyElement {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitPartial(this, context);
   }
}

export class TemplateNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitTemplate(this, context);
   }
}

export class IfNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitIf(this, context);
   }
}

export class ElseNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitElse(this, context);
   }
}

export class ForNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitFor(this, context);
   }
}

export class ForeachNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitForeach(this, context);
   }
}

// </editor-fold>

// <editor-fold desc="WaSaby data directives">

export class ArrayNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitArray(this, context);
   }
}

export class BooleanNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitBoolean(this, context);
   }
}

export class FunctionNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitFunction(this, context);
   }
}

export class NumberNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitNumber(this, context);
   }
}

export class ObjectNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitObject(this, context);
   }
}

export class StringNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitString(this, context);
   }
}

export class ValueNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitValue(this, context);
   }
}

// </editor-fold>

// <editor-fold desc="WaSaby text">

export class TextNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitText(this, context);
   }
}

export class TextDataNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitTextData(this, context);
   }
}

export class ExpressionNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitExpression(this, context);
   }
}

export class TranslationNode extends Ast {
   constructor() {
      super();
   }

   accept(visitor: IAstVisitor, context: any): any {
      return visitor.visitTranslation(this, context);
   }
}

// </editor-fold>
