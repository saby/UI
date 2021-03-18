/**
 * @description Represents abstract syntax nodes of mustache expression tree.
 * @author Крылов М.А.
 */

// tslint:disable:max-classes-per-file
// Намеренно отключаю правило max-classes-per-file, потому что
// в этом файле содержатся определения классов узлов Mustache-выражений.

export declare type TReturn = string | void;

export interface IContext {
   fileName: string;
}

export interface IExpressionVisitor<C, R> {
   visitProgramNode(node: ProgramNode, context: C): R;
   visitEmptyStatementNode(node: EmptyStatementNode, context: C): R;
   visitExpressionStatementNode(node: ExpressionStatementNode, context: C): R;
   visitThisExpressionNode(node: ThisExpressionNode, context: C): R;
   visitArrayExpressionNode(node: ArrayExpressionNode, context: C): R;
   visitObjectExpressionNode(node: ObjectExpressionNode, context: C): R;
   visitSequenceExpressionNode(node: SequenceExpressionNode, context: C): R;
   visitUnaryExpressionNode(node: UnaryExpressionNode, context: C): R;
   visitBinaryExpressionNode(node: BinaryExpressionNode, context: C): R;
   visitLogicalExpressionNode(node: LogicalExpressionNode, context: C): R;
   visitConditionalExpressionNode(node: ConditionalExpressionNode, context: C): R;
   visitCallExpressionNode(node: CallExpressionNode, context: C): R;
   visitMemberExpressionNode(node: MemberExpressionNode, context: C): R;
   visitDecoratorChainCallNode(node: DecoratorChainCallNode, context: C): R;
   visitDecoratorChainContext(node: DecoratorChainContext, context: C): R;
   visitDecoratorCallNode(node: DecoratorCallNode, context: C): R;
   visitIdentifierNode(node: IdentifierNode, context: C): R;
   visitExpressionBrace(node: ExpressionBrace, context: C): R;
   visitLiteralNode(node: LiteralNode, context: C): R;
}

export interface IPosition {
   line: number;
   column: number;
}

export interface ISourceLocation {
   start: IPosition;
   end: IPosition;
}

export abstract class Node {
   loc: ISourceLocation;
   /// @deprecated Use visitors.
   type: string;
   /// @deprecated Use visitors.
   string: string;

   protected constructor(type: string, loc: ISourceLocation) {
      this.type = type;
      this.loc = loc;
      this.string = '';
   }

   abstract accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn;
}

export class ProgramNode extends Node {
   body: Node[];

   constructor(body: Node[], loc: ISourceLocation) {
      super('Program', loc);
      this.body = body;
      if (body) {
         this.string = body[0].string;
      }
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitProgramNode(this, context);
   }
}

export class EmptyStatementNode extends Node {
   constructor(loc: ISourceLocation) {
      super('EmptyStatement', loc);
      this.string = '';
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitEmptyStatementNode(this, context);
   }
}

export class ExpressionStatementNode extends Node {
   expression: Node;

   constructor(expression: Node, loc: ISourceLocation) {
      super('ExpressionStatement', loc);
      this.expression = expression;
      if (expression) {
         this.string = expression.string;
      }
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitExpressionStatementNode(this, context);
   }
}

export class ThisExpressionNode extends Node {
   constructor(discriminant: Node, cases: Node[], loc: ISourceLocation) {
      super('ThisExpression', loc);
      this.string = 'this';
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitThisExpressionNode(this, context);
   }
}

export class ArrayExpressionNode extends Node {
   elements: Node[];

   constructor(elements: Node[], loc: ISourceLocation) {
      super('ArrayExpression', loc);
      this.elements = elements;
      this.string = '[';
      for (let i = 0; i < elements.length; ++i) {
         if (i !== 0) {
            this.string += ',';
         }
         this.string += elements[i].string;
      }
      this.string += ']';
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitArrayExpressionNode(this, context);
   }
}

export interface IObjectProperty {
   key: Node;
   value: Node;
}

export class ObjectExpressionNode extends Node {
   properties: IObjectProperty[];

   constructor(properties: IObjectProperty[], loc: ISourceLocation) {
      super('ObjectExpression', loc);
      this.properties = properties;
      this.string = '{';
      for (let i = 0; i < properties.length; ++i) {
         if (i !== 0) {
            this.string += ',';
         }
         this.string += properties[i].key.string + ':' + properties[i].value.string;
      }
      this.string += '}';
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitObjectExpressionNode(this, context);
   }
}

export class SequenceExpressionNode extends Node {
   expressions: Node[];

   constructor(expressions: Node[], loc: ISourceLocation) {
      super('SequenceExpression', loc);
      this.expressions = expressions;
      for (let i = 0; i < expressions.length; ++i) {
         if (i !== 0) {
            this.string += ',';
         }
         this.string += expressions[i].string;
      }
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitSequenceExpressionNode(this, context);
   }
}

export class UnaryExpressionNode extends Node {
   operator: string;
   prefix: boolean;
   argument: Node;
   // FIXME: Разобраться!!!
   value: any;

   constructor(operator: string, prefix: boolean, argument: Node, loc: ISourceLocation) {
      super('UnaryExpression', loc);
      this.operator = operator;
      this.prefix = prefix;
      this.argument = argument;
      if (argument) {
         if (prefix) {
            this.string = operator + argument.string;
         } else {
            this.string = argument.string + operator;
         }
      }
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitUnaryExpressionNode(this, context);
   }
}

export class BinaryExpressionNode extends Node {
   operator: string;
   left: Node;
   right: Node;

   constructor(operator: string, left: Node, right: Node, loc: ISourceLocation) {
      super('BinaryExpression', loc);
      this.operator = operator;
      this.left = left;
      this.right = right;
      if (left && right) {
         this.string = left.string + operator + right.string;
      }
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitBinaryExpressionNode(this, context);
   }
}

export class LogicalExpressionNode extends Node {
   operator: string;
   left: Node;
   right: Node;

   constructor(operator: string, left: Node, right: Node, loc: ISourceLocation) {
      super('LogicalExpression', loc);
      this.operator = operator;
      this.left = left;
      this.right = right;
      if (left && right) {
         this.string = left.string + operator + right.string;
      }
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitLogicalExpressionNode(this, context);
   }
}

export class ConditionalExpressionNode extends Node {
   test: Node;
   consequent: Node;
   alternate: Node;

   constructor(test: Node, consequent: Node, alternate: Node, loc: ISourceLocation) {
      super('ConditionalExpression', loc);
      this.test = test;
      this.consequent = consequent;
      this.alternate = alternate;
      if (test && consequent) {
         if (alternate) {
            this.string = test.string + '?' + consequent.string + ':' + alternate.string;
         } else {
            this.string = test.string + '?' + consequent.string;
         }
      }
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitConditionalExpressionNode(this, context);
   }
}

export class CallExpressionNode extends Node {
   callee: IdentifierNode | MemberExpressionNode;
   arguments: Node[];

   constructor(callee: IdentifierNode | MemberExpressionNode, args: Node[], loc: ISourceLocation) {
      super('CallExpression', loc);
      this.callee = callee;
      this.arguments = args;
      if (callee) {
         this.string = callee.string + '(';
         for (let i = 0; i < args.length; ++i) {
            if (i !== 0) {
               this.string += ',';
            }
            this.string += args[i].string;
         }
         this.string += ')';
      }
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitCallExpressionNode(this, context);
   }
}

export class MemberExpressionNode extends Node {
   object: Node;
   property: Node;
   computed: boolean;

   constructor(object: Node, property: Node, computed: boolean, loc: ISourceLocation) {
      super('MemberExpression', loc);
      this.object = object;
      this.property = property;
      this.computed = computed;
      if (object && property) {
         if (computed) {
            this.string = object.string + '[' + property.string + ']';
         } else {
            this.string = object.string + '.' + property.string;
         }
      }
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitMemberExpressionNode(this, context);
   }
}

export class DecoratorChainCallNode extends Node {
   identifier: string;
   argumentsDecorator: Node[];

   constructor(identifier: string, argumentsDecorator: Node[], loc: ISourceLocation) {
      super('DecoratorChainCall', loc);
      this.identifier = identifier;
      this.argumentsDecorator = argumentsDecorator;
      this.string = identifier;
      if (argumentsDecorator) {
         for (let i = 0; i < argumentsDecorator.length; ++i) {
            this.string += argumentsDecorator[i].string;
         }
      }
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitDecoratorChainCallNode(this, context);
   }
}

export class DecoratorChainContext extends Node {
   fn: DecoratorChainCallNode;
   entity: DecoratorChainContext | undefined;

   constructor(fn: DecoratorChainCallNode, entity: DecoratorChainContext | undefined, loc: ISourceLocation) {
      super('DecoratorChainContext', loc);
      this.fn = fn;
      this.entity = entity;
      this.string = fn.string;
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitDecoratorChainContext(this, context);
   }
}

export class DecoratorCallNode extends Node {
   decorator: Node;
   caller: DecoratorChainContext;

   constructor(decorator: Node, caller: DecoratorChainContext, loc: ISourceLocation) {
      super('DecoratorCall', loc);
      this.decorator = decorator;
      this.caller = caller;
      if (caller) {
         this.string = caller.string + '|' + decorator.string;
      } else {
         this.string = '|' + decorator.string;
      }
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitDecoratorCallNode(this, context);
   }
}

export class IdentifierNode extends Node {
   name: string;

   constructor(name: string, loc: ISourceLocation) {
      super('Identifier', loc);
      this.name = name;
      this.string = name;
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitIdentifierNode(this, context);
   }
}

export class ExpressionBrace extends Node {
   name: Node;

   constructor(expression: Node, loc: ISourceLocation) {
      super('Brace', loc);
      this.name = expression;
      this.string = '(' + expression.string + ')';
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitExpressionBrace(this, context);
   }
}

export class LiteralNode extends Node {
   value: string;

   constructor(value: string, isString: boolean, loc: ISourceLocation) {
      super('Literal', loc);
      this.value = value;
      if (isString) {
         this.value = this.value.trim().replace(/^['"](.*)['"]$/, '$1');
      }
      this.string = value;
   }

   accept(visitor: IExpressionVisitor<IContext, TReturn>, context: IContext): TReturn {
      return visitor.visitLiteralNode(this, context);
   }
}

/* tslint:enable:max-classes-per-file */
