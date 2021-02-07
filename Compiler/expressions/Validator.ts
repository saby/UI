/**
 * @description Represents mustache expression validators.
 * @author Крылов М.А.
 * @file Compiler/expressions/Validator.ts
 */

import * as Nodes from './Nodes';
import { IErrorHandler } from '../utils/ErrorHandler';
import { SourcePosition } from '../html/Reader';

/**
 * Interface for processing options.
 */
export interface IOptions {

   /**
    * Processing template file name.
    */
   fileName: string;

   /**
    * Position in source template file.
    */
   position: SourcePosition;
}

/**
 * Represents validator interface.
 */
export interface IValidator {

   /**
    * Check mustache-expression for bind attribute.
    * @param program {ProgramNode} Mustache expression program node.
    * @param options {IOptions} Processing options.
    */
   checkBindExpression(program: Nodes.ProgramNode, options: IOptions): void;

   /**
    * Check mustache-expression for event attribute.
    * @param program {ProgramNode} Mustache expression program node.
    * @param options {IOptions} Processing options.
    */
   checkEventExpression(program: Nodes.ProgramNode, options: IOptions): void;

   /**
    * Check mustache-expression for text node.
    * @param program {ProgramNode} Mustache expression program node.
    * @param options {IOptions} Processing options.
    */
   checkTextExpression(program: Nodes.ProgramNode, options: IOptions): void;
}

enum State {
   IN_ARRAY,
   IN_BINARY,
   IN_CALLEE,
   IN_CALL_ARGUMENTS,
   IN_CONDITIONAL,
   IN_DECORATOR_CALL,
   IN_DECORATOR_CHAIN_CALL,
   IN_DECORATOR_CHAIN_CONTEXT,
   IN_LOGICAL,
   IN_OBJECT_PROPERTY,
   IN_PROGRAM,
   IN_SEQUENCE,
   IN_UNARY,
   IN_MEMBER
}

enum BindContextState {
   INITIAL,
   IDENTIFIER,
   MEMBER
}

enum EventContextState {
   INITIAL,
   IN_HANDLER,
   IN_CONTEXT,
   IN_ARGUMENTS
}

enum TextContextState {
   INITIAL
}

interface IContext extends IOptions {
   state: State;
   contextState: BindContextState | EventContextState | TextContextState;
   programBodyLength: number;
   forbidComputedMembers: boolean;
}

class BaseValidator implements Nodes.IExpressionVisitor<IContext, void> {

   private readonly errorHandler: IErrorHandler;
   private readonly isDecoratorForbidden: boolean;

   protected constructor(errorHandler: IErrorHandler, isDecoratorForbidden: boolean) {
      this.errorHandler = errorHandler;
      this.isDecoratorForbidden = isDecoratorForbidden;
   }

   visitArrayExpressionNode(node: Nodes.ArrayExpressionNode, context: IContext): void {
      const childContext: IContext = {
         ...context,
         state: State.IN_ARRAY
      };
      node.elements.forEach((element: Nodes.Node) => element.accept(this, childContext));
   }

   visitBinaryExpressionNode(node: Nodes.BinaryExpressionNode, context: IContext): void {
      const childContext: IContext = {
         ...context,
         state: State.IN_BINARY
      };
      node.left.accept(this, childContext);
      node.right.accept(this, childContext);
   }

   visitCallExpressionNode(node: Nodes.CallExpressionNode, context: IContext): void {
      const calleeContext: IContext = {
         ...context,
         state: State.IN_CALLEE
      };
      node.callee.accept(this, calleeContext);
      const callArgumentsContext: IContext = {
         ...context,
         state: State.IN_CALL_ARGUMENTS
      };
      node.arguments.forEach((element: Nodes.Node) => element.accept(this, callArgumentsContext));
   }

   visitConditionalExpressionNode(node: Nodes.ConditionalExpressionNode, context: IContext): void {
      const childContext: IContext = {
         ...context,
         state: State.IN_CONDITIONAL
      };
      node.test.accept(this, childContext);
      node.consequent.accept(this, childContext);
      if (node.alternate) {
         node.alternate.accept(this, childContext);
      }
   }

   visitDecoratorCallNode(node: Nodes.DecoratorCallNode, context: IContext): void {
      if (this.isDecoratorForbidden) {
         throw new Error('Использование декораторов запрещено');
      }
      const childContext: IContext = {
         ...context,
         state: State.IN_DECORATOR_CALL
      };
      node.decorator.accept(this, childContext);
      if (node.caller) {
         node.caller.accept(this, childContext);
      }
   }

   visitDecoratorChainCallNode(node: Nodes.DecoratorChainCallNode, context: IContext): void {
      if (this.isDecoratorForbidden) {
         throw new Error('Использование декораторов запрещено');
      }
      const childContext: IContext = {
         ...context,
         state: State.IN_DECORATOR_CHAIN_CALL
      };
      if (node.argumentsDecorator) {
         node.argumentsDecorator.forEach((element: Nodes.Node) => element.accept(this, childContext));
      }
   }

   visitDecoratorChainContext(node: Nodes.DecoratorChainContext, context: IContext): void {
      if (this.isDecoratorForbidden) {
         throw new Error('Использование декораторов запрещено');
      }
      const childContext: IContext = {
         ...context,
         state: State.IN_DECORATOR_CHAIN_CONTEXT
      };
      if (node.entity) {
         node.entity.accept(this, childContext);
      }
      node.fn.accept(this, childContext);
   }

   visitEmptyStatementNode(node: Nodes.EmptyStatementNode, context: IContext): void {
      return;
   }

   visitExpressionBrace(node: Nodes.ExpressionBrace, context: IContext): void {
      node.name.accept(this, context);
   }

   visitExpressionStatementNode(node: Nodes.ExpressionStatementNode, context: IContext): void {
      node.expression.accept(this, context);
   }

   visitIdentifierNode(node: Nodes.IdentifierNode, context: IContext): void {
      if (context.state === State.IN_CALLEE) {
         if (node.name === 'debug') {
            this.errorHandler.warn(
               `В тексте шаблона обнаружено debug-выражение. Необходимо убрать его в production`,
               context
            )
         }
      }
      return;
   }

   visitLiteralNode(node: Nodes.LiteralNode, context: IContext): void {
      return;
   }

   visitLogicalExpressionNode(node: Nodes.LogicalExpressionNode, context: IContext): void {
      const childContext: IContext = {
         ...context,
         state: State.IN_LOGICAL
      };
      node.left.accept(this, childContext);
      node.right.accept(this, childContext);
   }

   visitMemberExpressionNode(node: Nodes.MemberExpressionNode, context: IContext): void {
      const childContext: IContext = {
         ...context,
         state: State.IN_MEMBER
      };
      node.property.accept(this, childContext);
      node.object.accept(this, childContext);
   }

   visitObjectExpressionNode(node: Nodes.ObjectExpressionNode, context: IContext): void {
      const childContext: IContext = {
         ...context,
         state: State.IN_OBJECT_PROPERTY
      };
      for (const property in node.properties) {
         const data = node.properties[property];
         data.key.accept(this, childContext);
         data.value.accept(this, childContext);
      }
   }

   visitProgramNode(node: Nodes.ProgramNode, context: IContext): void {
      const childContext: IContext = {
         ...context,
         state: State.IN_PROGRAM
      };
      if (node.body.length > context.programBodyLength) {
         this.errorHandler.warn(
            `Получено более 1 выражения в Mustache-выражении. Возможно, Mustache-выражение содержит несколько выражений, разделенных символом ";"`,
            context
         )
      }
      node.body.forEach((element: Nodes.Node) => element.accept(this, childContext));
   }

   visitSequenceExpressionNode(node: Nodes.SequenceExpressionNode, context: IContext): void {
      const childContext: IContext = {
         ...context,
         state: State.IN_SEQUENCE
      };
      node.expressions.forEach((element: Nodes.Node) => element.accept(this, childContext));
   }

   visitThisExpressionNode(node: Nodes.ThisExpressionNode, context: IContext): void {
      return;
   }

   visitUnaryExpressionNode(node: Nodes.UnaryExpressionNode, context: IContext): void {
      const childContext: IContext = {
         ...context,
         state: State.IN_UNARY
      };
      node.argument.accept(this, childContext);
   }
}

class BindValidator extends BaseValidator {

   constructor(errorHandler: IErrorHandler) {
      super(errorHandler, true);
   }

   visitProgramNode(node: Nodes.ProgramNode, context: IContext): void {
      const childrenContext: IContext = {
         ...context,
         contextState: BindContextState.INITIAL
      };
      super.visitProgramNode(node, childrenContext);
   }

   visitArrayExpressionNode(node: Nodes.ArrayExpressionNode, context: IContext): void {
      if (context.contextState === BindContextState.INITIAL) {
         throw new Error('Запрещено объявлять массив в корне');
      }
      super.visitArrayExpressionNode(node, context);
   }

   visitObjectExpressionNode(node: Nodes.ObjectExpressionNode, context: IContext): void {
      if (context.contextState === BindContextState.INITIAL) {
         throw new Error('Запрещено объявлять объект в корне');
      }
      super.visitObjectExpressionNode(node, context);
   }

   visitSequenceExpressionNode(node: Nodes.SequenceExpressionNode, context: IContext): void {
      if (context.contextState === BindContextState.INITIAL) {
         throw new Error('Запрещено использовать перечисление (sequence expression) в корне');
      }
      super.visitSequenceExpressionNode(node, context);
   }

   visitUnaryExpressionNode(node: Nodes.UnaryExpressionNode, context: IContext): void {
      if (context.contextState === BindContextState.INITIAL) {
         throw new Error('Запрещено использовать унарный оператор в корне');
      }
      super.visitUnaryExpressionNode(node, context);
   }

   visitBinaryExpressionNode(node: Nodes.BinaryExpressionNode, context: IContext): void {
      if (context.contextState === BindContextState.INITIAL) {
         throw new Error('Запрещено использовать бинарный оператор в корне');
      }
      super.visitBinaryExpressionNode(node, context);
   }

   visitLogicalExpressionNode(node: Nodes.LogicalExpressionNode, context: IContext): void {
      if (context.contextState === BindContextState.INITIAL) {
         throw new Error('Запрещено использовать логический оператор в корне');
      }
      super.visitLogicalExpressionNode(node, context);
   }

   visitConditionalExpressionNode(node: Nodes.ConditionalExpressionNode, context: IContext): void {
      if (context.contextState === BindContextState.INITIAL) {
         throw new Error('Запрещено использовать тернарный оператор в корне');
      }
      super.visitConditionalExpressionNode(node, context);
   }

   visitCallExpressionNode(node: Nodes.CallExpressionNode, context: IContext): void {
      if (context.contextState === BindContextState.INITIAL) {
         throw new Error(
            'Запрещено выполнять bind на вызов функции. Вместо a.b.c.get("field") нужно использовать a.b.c["field"]'
         );
      }
      super.visitCallExpressionNode(node, context);
   }

   visitMemberExpressionNode(node: Nodes.MemberExpressionNode, context: IContext): void {
      const isRootExpression = context.contextState === BindContextState.INITIAL;
      if (!isRootExpression) {
         return super.visitMemberExpressionNode(node, context);
      }
      const childContext: IContext = {
         ...context,
         contextState: BindContextState.MEMBER
      };
      let obj = node;
      const arr = [];
      if (obj.property) {
         while (obj.type === 'MemberExpression') {
            if (obj.computed) {
               if (childContext.forbidComputedMembers) {
                  throw new Error('Запрещено использование вычисляемых свойств');
               }
               arr.unshift(obj.property.accept(this, childContext));
            } else {
               arr.unshift((obj.property as Nodes.IdentifierNode).name);
            }
            obj = obj.object as Nodes.MemberExpressionNode;
         }
         if (obj.type === 'Identifier') {
            arr.unshift(((obj as unknown) as Nodes.IdentifierNode).name);
         }
         if (arr.length === 2 && arr[0].slice(1, -1) === '_options') {
            throw new Error(
               'Запрещено использовать bind на свойства объекта "_options": данный объект заморожен'
            );
         }
         return;
      }
      obj.object.accept(this, childContext);
   }

   visitLiteralNode(node: Nodes.LiteralNode, context: IContext): void {
      if (context.contextState === BindContextState.INITIAL) {
         throw new Error('Использование литералов запрещено');
      }
      super.visitLiteralNode(node, context);
   }
}

class EventValidator extends BaseValidator {

   constructor(errorHandler: IErrorHandler) {
      super(errorHandler, true);
   }

   visitProgramNode(node: Nodes.ProgramNode, context: IContext): void {
      const childrenContext: IContext = {
         ...context,
         contextState: EventContextState.INITIAL
      };
      super.visitProgramNode(node, childrenContext);
   }

   visitArrayExpressionNode(node: Nodes.ArrayExpressionNode, context: IContext): void {
      if (context.contextState === EventContextState.INITIAL) {
         throw new Error('Запрещено объявлять массив в корне');
      }
      super.visitArrayExpressionNode(node, context);
   }

   visitObjectExpressionNode(node: Nodes.ObjectExpressionNode, context: IContext): void {
      if (context.contextState === EventContextState.INITIAL) {
         throw new Error('Запрещено объявлять объект в корне');
      }
      super.visitObjectExpressionNode(node, context);
   }

   visitSequenceExpressionNode(node: Nodes.SequenceExpressionNode, context: IContext): void {
      if (context.contextState === EventContextState.INITIAL) {
         throw new Error('Запрещено использовать перечисление (sequence expression) в корне');
      }
      super.visitSequenceExpressionNode(node, context);
   }

   visitUnaryExpressionNode(node: Nodes.UnaryExpressionNode, context: IContext): void {
      if (context.contextState === EventContextState.INITIAL) {
         throw new Error('Запрещено использовать унарный оператор в корне');
      }
      super.visitUnaryExpressionNode(node, context);
   }

   visitBinaryExpressionNode(node: Nodes.BinaryExpressionNode, context: IContext): void {
      if (context.contextState === EventContextState.INITIAL) {
         throw new Error('Запрещено использовать бинарный оператор в корне');
      }
      super.visitBinaryExpressionNode(node, context);
   }

   visitLogicalExpressionNode(node: Nodes.LogicalExpressionNode, context: IContext): void {
      if (context.contextState === EventContextState.INITIAL) {
         throw new Error('Запрещено использовать логический оператор в корне');
      }
      super.visitLogicalExpressionNode(node, context);
   }

   visitConditionalExpressionNode(node: Nodes.ConditionalExpressionNode, context: IContext): void {
      if (context.contextState === EventContextState.INITIAL) {
         throw new Error('Запрещено использовать тернарный оператор в корне');
      }
      super.visitConditionalExpressionNode(node, context);
   }

   visitCallExpressionNode(node: Nodes.CallExpressionNode, context: IContext): void {
      if (context.contextState !== EventContextState.INITIAL) {
         return super.visitCallExpressionNode(node, context);
      }
      const calleeContext: IContext = {
         ...context,
         contextState: EventContextState.IN_HANDLER
      };
      node.callee.accept(this, calleeContext);
      const argumentsContext: IContext = {
         ...context,
         contextState: EventContextState.IN_ARGUMENTS
      };
      node.arguments.forEach((element: Nodes.Node) => element.accept(this, argumentsContext));
   }

   visitMemberExpressionNode(node: Nodes.MemberExpressionNode, context: IContext): void {
      if (context.contextState === EventContextState.IN_HANDLER) {
         if (node.computed) {
            throw new Error('Имя функции-обработчика события не может быть вычисляемым');
         }
         const childContext: IContext = {
            ...context,
            contextState: EventContextState.IN_CONTEXT
         };
         node.object.accept(this, childContext);
         return super.visitMemberExpressionNode(node, childContext);
      }
      const argumentsContext: IContext = {
         ...context,
         forbidComputedMembers: false
      };
      super.visitMemberExpressionNode(node, argumentsContext);
   }

   visitLiteralNode(node: Nodes.LiteralNode, context: IContext): void {
      if (context.contextState === BindContextState.INITIAL) {
         throw new Error('Использование литералов запрещено');
      }
      super.visitLiteralNode(node, context);
   }
}

class TextValidator extends BaseValidator {
   constructor(errorHandler: IErrorHandler) {
      super(errorHandler, false);
   }
}

class Validator implements IValidator {

   private readonly bindValidator: BaseValidator;

   private readonly eventValidator: BaseValidator;

   private readonly textValidator: BaseValidator;

   constructor(errorHandler: IErrorHandler) {
      this.bindValidator = new BindValidator(errorHandler);
      this.eventValidator = new EventValidator(errorHandler);
      this.textValidator = new TextValidator(errorHandler);
   }

   checkBindExpression(program: Nodes.ProgramNode, options: IOptions): void {
      const context: IContext = {
         ...options,
         state: State.IN_PROGRAM,
         contextState: BindContextState.INITIAL,
         programBodyLength: 1,
         forbidComputedMembers: false
      };
      program.accept(this.bindValidator, context);
   }

   checkEventExpression(program: Nodes.ProgramNode, options: IOptions): void {
      const context: IContext = {
         ...options,
         state: State.IN_PROGRAM,
         contextState: EventContextState.INITIAL,
         programBodyLength: 1,
         forbidComputedMembers: false
      };
      program.accept(this.eventValidator, context);
   }

   checkTextExpression(program: Nodes.ProgramNode, options: IOptions): void {
      const context: IContext = {
         ...options,
         state: State.IN_PROGRAM,
         contextState: TextContextState.INITIAL,
         programBodyLength: 1,
         forbidComputedMembers: false
      };
      program.accept(this.textValidator, context);
   }
}

/**
 * Create new instance of mustache-expression validator.
 * @param errorHandler {IErrorHandler} Error handler instance.
 */
export default function createValidator(errorHandler: IErrorHandler): IValidator {
   return new Validator(errorHandler);
}
