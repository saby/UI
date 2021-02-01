/// <amd-module name="UI/_builder/Tmpl/expressions/_private/Nodes" />

/**
 * @description Represents abstract syntax nodes of mustache expression tree.
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/expressions/_private/Nodes.ts
 */

import { createErrorHandler } from 'UI/_builder/Tmpl/utils/ErrorHandler';
import * as FSC from 'UI/_builder/Tmpl/modules/data/utils/functionStringCreator';
import * as common from 'UI/_builder/Tmpl/modules/utils/common';
import * as decorators from './Decorators';
import { getDotsScopeSubstitution } from 'UI/_builder/Tmpl/codegen/Compatible';
import { genGetter, genSetter, genDecorate } from 'UI/_builder/Tmpl/codegen/TClosure';

// tslint:disable:max-classes-per-file
// Намеренно отключаю правило max-classes-per-file,
// потому что в этом файле содержатся определения
// классов узлов Mustache-выражений и
// реализации паттерна "Посетитель" для этих узлов.

const errorHandler = createErrorHandler(true);

export interface IPosition {
   line: number;
   column: number;
}

export interface ISourceLocation {
   start: IPosition;
   end: IPosition;
}

declare type TReturn = string | void;

interface IContext {
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

interface IExpressionVisitorContext extends IContext {
   fileName: string;
   isControl: boolean;
   attributeName: string;
   isExprConcat: boolean;
   escape: boolean;
   sanitize: boolean;
   caller: string;
   data: any;
   configObject: {
      bindings: any;
   };
   getterContext: string;
   forbidComputedMembers: boolean;
   childrenStorage: string[];
   checkChildren: boolean;
   isDirtyChecking?: boolean;
}

// tslint:disable:object-literal-key-quotes
const IDENTIFIER_EXPRESSIONS = {
   'rk': 'rk',
   'debug': 'debug',
   '...': getDotsScopeSubstitution(),
   'undefined': 'undefined',
   'null': 'null'
};
// tslint:enable:object-literal-key-quotes

const ESCAPE_FALSE_DECORATORS = [
   'sanitize',
   'unescape',
   'money',
   'highlight',
   'colorMark',
   'wrapURLs'
];

const SET_HTML_UNSAFE = '__setHTMLUnsafe';

IDENTIFIER_EXPRESSIONS[SET_HTML_UNSAFE] = SET_HTML_UNSAFE;

function calculateContext(identifier: string, context: IExpressionVisitorContext, defaultContext: string): string {
   if (context.checkChildren) {
      if (context.childrenStorage.indexOf(identifier) > -1) {
         // FIXME: ПЛОХО! ОЧЕНЬ ПЛОХО! ТОЛЬКО ДЛЯ СОБЫТИЙ!
         return 'this._children';
      }
   }
   return defaultContext;
}

function resolveIdentifierBase(
   node: IdentifierNode,
   data: IExpressionVisitorContext['data'],
   forMemberExpression: boolean,
   context: string
): string | null {
   if (IDENTIFIER_EXPRESSIONS[node.name]) {
      return IDENTIFIER_EXPRESSIONS[node.name];
   }
   if (data) {
      return data + '[' + FSC.wrapAroundQuotes(node.name) + ']';
   }
   if (node.name === 'context') {
      // context может перекрываться в scope'е, поэтому вставляем проверку, так ли это
      // Если он перекрыт, возвращаем перекрытое поле, иначе сам контекст
      // может быть заменить getter на data.context? значительное сокращение
      return `(!${genGetter(context, ['"context"'])} ? context : ${genGetter('data', ['"context"'])})`;
   }
   if (forMemberExpression) {
      return context;
   }
   return null;
}

function resolveIdentifier(
   node: IdentifierNode,
   data: IExpressionVisitorContext['data'],
   forMemberExpression: boolean,
   context: string
): string {
   const result = resolveIdentifierBase(node, data, forMemberExpression, context);
   if (result !== null) {
      return result;
   }
   return genGetter(context, ['"' + node.name + '"']);
}

function resolveIdentifierSetter(
   node: IdentifierNode,
   data: IExpressionVisitorContext['data'],
   forMemberExpression: boolean,
   context: string
): string {
   const result = resolveIdentifierBase(node, data, forMemberExpression, context);
   if (result !== null) {
      return result;
   }
   return genSetter(context, ['"' + node.name + '"']);
}

// приводит строку к стандартному виду, если это expression был Literal
// - без лишних кавычек, если что-то еще - чтобы эта строка была исполняемой
function repairValue(str: any, type: string): any {
   if (typeof str === 'string') {
      if (type === 'Literal' && str !== 'null' && str !== 'undefined') {
         return str
            .replace(/^"/, '')
            .replace(/"$/, '');
      }
      return FSC.wrapAroundExec(str);
   }
   return str;
}

const BINDING_NAMES = {
   one: 'bind',
   two: 'mutable'
};

function checkForContextDecorators(text: string): boolean {
   return (text.indexOf(BINDING_NAMES.one) > -1) || (text.indexOf(BINDING_NAMES.two) > -1);
}

export class ExpressionVisitor implements IExpressionVisitor<IExpressionVisitorContext, string> {

   processUnescapedHtmlFunction(args: Node[], context: IExpressionVisitorContext): string {
      let res = '';
      if (args && args.length > 0) {
         const argument = args[0];
         res = argument.accept(this, context) as string;
         context.escape = false;
         context.sanitize = false;
      }
      return res;
   }

   processMemberProperty(node: MemberExpressionNode, context: IExpressionVisitorContext): { arr: string[]; dataSource: string; } {
      const arr = [];
      let obj = node;
      let dataSource = '';
      while (obj.type === 'MemberExpression') {
         if (obj.computed) {
            if (context.forbidComputedMembers) {
               throw new Error('Вычисляемые member-выражения запрещены');
            }
            arr.unshift(obj.property.accept(this, context));
         } else {
            arr.unshift(FSC.wrapAroundQuotes((obj.property as IdentifierNode).name));
         }
         obj = obj.object as MemberExpressionNode;
      }
      if (obj.type === 'Identifier') {
         const identifierNode = ((obj as unknown) as IdentifierNode);
         dataSource = resolveIdentifier(identifierNode, context.data, true, context.getterContext);
         if (dataSource === context.getterContext) {
            const identifierName = identifierNode.name;
            dataSource = calculateContext(identifierName, context, dataSource);
            // Значение любого data-идентификатора будет получено из scope'а, поэтому ставим
            // data в качестве источника, а сам идентификтор ставим первым в списке полей
            arr.unshift(FSC.wrapAroundQuotes(identifierName));
         }
      } else {
         // Если источник данных - сложное выражение, его нужно будет вычислять
         dataSource = obj.accept(this, context) as string;
      }
      return {
         arr,
         dataSource
      };
   }

   buildArgumentsArray(args: Node[], context: IExpressionVisitorContext): string {
      const elements = args.map((node: Node) => node.accept(this, context)).toString();
      return `[${elements}]`;
   }

   buildSafeCheckArgumentsChain(args: Node[], context: IExpressionVisitorContext): string {
      let result = '';
      args.forEach((node: Node) => {
         const itemCheck = node.accept(this, context);
         if (typeof itemCheck === 'string' && itemCheck.indexOf('thelpers.getter') > -1) {
            result += `(${itemCheck} !== undefined)&&`;
         }
      });
      return result;
   }

   visitArrayExpressionNode(node: ArrayExpressionNode, context: IExpressionVisitorContext): string {
      const elements = node.elements.map(
         (node: Node) => repairValue(node.accept(this, context), node.type)
      );
      return FSC.getStr(elements);
   }

   visitBinaryExpressionNode(node: BinaryExpressionNode, context: IExpressionVisitorContext): string {
      const left = node.left.accept(this, context);
      const right = node.right.accept(this, context);
      return left + node.operator + right;
   }

   visitCallExpressionNode(node: CallExpressionNode, context: IExpressionVisitorContext): string {
      const callee = node.callee.accept(this, context);
      if (callee) {
         if (callee === SET_HTML_UNSAFE) {
            return this.processUnescapedHtmlFunction(node.arguments, context);
         }
         const args = this.buildArgumentsArray(node.arguments, context);
         // FIXME: Use instanceof
         let object: string = 'funcContext';
         if (node.callee.type === 'MemberExpression') {
            const calleeNode = node.callee as MemberExpressionNode;
            object = <string>calleeNode.object.accept(this, context);
         }
         if (typeof context.attributeName === 'string' && /__dirtyCheckingVars_\d+$/gi.test(context.attributeName) || context.isDirtyChecking) {
            // Эта проверка используется для проброса переменных из замыкания(dirtyCheckingVars)
            // Значения переменных из замыкания вычисляются в момент создания контентной опции
            // и пробрасываются через все контролы, оборачивающие контент.
            // Если в замыкании используется функция, в какой-то момент этой функции может не оказаться,
            // мы попытаемся ее вызвать и упадем с TypeError
            // Поэтому нужно проверить ее наличие. Кроме того, нужно проверить, что аргументы этой функции,
            // если такие есть, тоже не равны undefined, иначе может случиться TypeError внутри функции
            // Изначально здесь была проверка без !== undefined. Но такая проверка некорректно работала
            // в случае, если одно из проверяемых значения было рано 0, например.
            // Вообще этой проверки быть не должно. От нее можно избавиться,
            // если не пробрасывать dirtyCheckingVars там, где это не нужно.
            const functionSafeCheck = `(${callee} !== undefined)&&`;
            const argsSafeCheck = this.buildSafeCheckArgumentsChain(node.arguments, context);
            return `(${functionSafeCheck}${argsSafeCheck}${callee}.apply(${object}, ${args}))`;
         }
         return `${callee}.apply(${object}, ${args})`;
      }
      errorHandler.error(
         'Обшибка при обработке выражения вызова функции. Object to call on is "'
         + node.callee.string + '" equals to ' + callee,
         {
            fileName: context.fileName
         }
      );
   }

   visitConditionalExpressionNode(node: ConditionalExpressionNode, context: IExpressionVisitorContext): string {
      let alternate = "''";
      let isAlternateEmpty;
      if (typeof node.alternate !== 'undefined') {
         alternate = node.alternate.accept(this, context) as string;
      } else if (context.isControl && (typeof context.attributeName !== 'undefined')) {
         // Необходимо поддержать два варианта обработки тернарного оператора для контрола,
         // когда alternate есть undefined
         // * В случае, если речь идет об атрибуте class, style или attr:some_attribute, то в качестве альтернативы
         // вместо undefined необходимо возвращать пустую строку;
         // * Во всех остальных случаях возвращать undefined.
         isAlternateEmpty =
            context.isExprConcat ||
            context.attributeName === 'class' ||
            context.attributeName === 'style' ||
            (
               context.attributeName.includes &&
               context.attributeName.includes('attr:')
            );
         if (!isAlternateEmpty) {
            alternate = 'undefined';
         }
      }
      const test = node.test.accept(this, context);
      const consequent = node.consequent.accept(this, context);
      return `(${test} ? ${consequent} : ${alternate})`;
   }

   visitDecoratorCallNode(node: DecoratorCallNode, context: IExpressionVisitorContext): string {
      context.caller = node.caller
         ?  node.caller.accept(this, context) as string
         : undefined;
      const val = node.decorator.accept(this, context) as string;
      const decoratorAsChainContext = (node.decorator as DecoratorChainContext).fn;
      const chainContextAsIdentifier = (decoratorAsChainContext as DecoratorChainCallNode).identifier;
      if (
         (chainContextAsIdentifier === BINDING_NAMES.one || chainContextAsIdentifier === BINDING_NAMES.two) &&
         (context.isControl || checkForContextDecorators(node.decorator.string))
      ) {
         context.configObject.bindings = common.bindingArrayHolder(
            context.configObject.bindings, ((val as unknown) as { binding: any }).binding
         );
         return ((val as unknown) as { value: any }).value;
      }
      return val;
   }

   visitDecoratorChainCallNode(node: DecoratorChainCallNode, context: IExpressionVisitorContext): string {
      const caller = context.caller;
      const decArgs = (node.argumentsDecorator || []).map((node: Node) => node.accept(this, context));
      if (node.identifier === BINDING_NAMES.one || node.identifier === BINDING_NAMES.two) {
         decArgs.unshift(context.attributeName);
      }
      if (ESCAPE_FALSE_DECORATORS.indexOf(node.identifier) > -1) {
         context.escape = false;
      }
      decArgs.unshift(caller);
      if (checkForContextDecorators(node.identifier)) {
         return decorators[node.identifier].apply(undefined, decArgs);
      }
      return genDecorate('"' + node.identifier + '"', decArgs as string[]);
   }

   visitDecoratorChainContext(node: DecoratorChainContext, context: IExpressionVisitorContext): string {
      if (node.entity) {
         context.caller =  node.entity.accept(this, context) as string;
         return node.fn.accept(this, context) as string;
      }
      return node.fn.accept(this, context) as string;
   }

   visitEmptyStatementNode(node: EmptyStatementNode, context: IExpressionVisitorContext): string {
      return '';
   }

   visitExpressionBrace(node: ExpressionBrace, context: IExpressionVisitorContext): string {
      const expression = node.name.accept(this, context);
      return `(${expression})`;
   }

   visitExpressionStatementNode(node: ExpressionStatementNode, context: IExpressionVisitorContext): string {
      return node.expression.accept(this, context) as string;
   }

   visitIdentifierNode(node: IdentifierNode, context: IExpressionVisitorContext): string {
      return resolveIdentifier(node, context.data, false, context.getterContext);
   }

   visitLiteralNode(node: LiteralNode, context: IExpressionVisitorContext): string {
      if (typeof node.value === 'string') {
         return '"' + node.value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"') + '"';
      }

      // если в выражении участвует null или undefined, вернем их как строки, чтобы они были представлены
      // в функции как константы. Иначе вообще ничего не будет вставлено
      if (node.value === null) {
         return 'null';
      }
      if (node.value === undefined) {
         return 'undefined';
      }
      return node.value;
   }

   visitLogicalExpressionNode(node: LogicalExpressionNode, context: IExpressionVisitorContext): string {
      const left = node.left.accept(this, context);
      const right = node.right.accept(this, context);
      return left + node.operator + right;
   }

   visitMemberExpressionNode(node: MemberExpressionNode, context: IExpressionVisitorContext): string {
      if (node.property) {
         const { arr, dataSource } = this.processMemberProperty(node, context);
         return genGetter(dataSource, arr);
      }
      return node.object.accept(this, context) as string;
   }

   visitObjectExpressionNode(node: ObjectExpressionNode, context: IExpressionVisitorContext): string {
      const properties = { };
      // tslint:disable-next-line:forin
      for (const property in node.properties) {
         const data = node.properties[property];
         let key = data.key.accept(this, context) as string;
         if (key) {
            const value = data.value.accept(this, context);
            key = repairValue(key, data.key.type);
            properties[key] = repairValue(value, data.value.type);
         }
      }
      return FSC.getStr(properties);
   }

   visitProgramNode(node: ProgramNode, context: IExpressionVisitorContext): string {
      context.isExprConcat = node.body.length > 1;
      // FIXME: Не поддерживается наличие в body более чем 1 выражения. Нужен вывод предупреждения?
      //  Больше одного выражения - это когда они разделены ';'.
      return node.body[0].accept(this, context) as string;
   }

   visitSequenceExpressionNode(node: SequenceExpressionNode, context: IExpressionVisitorContext): string {
      return node.expressions.map((node: Node) => node.accept(this, context)).join(', ');
   }

   visitThisExpressionNode(node: ThisExpressionNode, context: IExpressionVisitorContext): string {
      return 'this';
   }

   visitUnaryExpressionNode(node: UnaryExpressionNode, context: IExpressionVisitorContext): string {
      const argument = node.argument.accept(this, context);
      node.value = node.operator + argument;
      return node.value;
   }

}

enum EventVisitorState {
   INITIAL,
   BEFORE_HANDLER,
   IN_HANDLER,
   IN_CONTEXT,
   IN_ARGUMENTS,
   AFTER_HANDLER
}

export interface IEventArtifact {
   args: string[];
   fn: string;
   handlerName: string;
   context: string;
}

/**
 * Данный класс предназначен для обхода дерева выражения,
 * соответствующее обработчику на события.
 *
 * В результате обхода выражения генерируется артефакт, содержащий:
 * 1) Функцию-обработчик события в соответствующем контексте от this;
 * 2) Имя функции-обработчика;
 * 3) Набор аргументов в контексте от data.
 */
export class EventExpressionVisitor extends ExpressionVisitor {
   private context: string | null;
   private handlerName: string | null;
   private args: string[];
   private state: EventVisitorState;

   constructor() {
      super();
      this.context = 'this';
      this.handlerName = null;
      this.args = [];
      this.state = EventVisitorState.INITIAL;
   }

   visit(program: ProgramNode, context: IExpressionVisitorContext): IEventArtifact {
      const fn = program.accept(this, context) as string;
      if (this.state === EventVisitorState.AFTER_HANDLER) {
         return {
            fn,
            args: this.args,
            handlerName: this.handlerName,
            context: this.context
         };
      }
      throw new Error('Ожидалось, что обработчик события является функцией');
   }

   visitCallExpressionNode(node: CallExpressionNode, context: IExpressionVisitorContext): string {
      if (this.state !== EventVisitorState.BEFORE_HANDLER) {
         return super.visitCallExpressionNode(node, context);
      }
      this.state = EventVisitorState.IN_HANDLER;
      const callee = node.callee.accept(this, context);
      this.state = EventVisitorState.IN_ARGUMENTS;
      // Обработаем аргументы функции-обработчика события
      const argsContext = { ...context };
      argsContext.getterContext = 'data';
      argsContext.checkChildren = false;
      this.args = node.arguments.map((arg: Node): string => `${arg.accept(this, argsContext)}`);
      this.state = EventVisitorState.AFTER_HANDLER;
      return callee as string;
   }

   visitIdentifierNode(node: IdentifierNode, context: IExpressionVisitorContext): string {
      const identifierContext = { ...context };
      if (this.state === EventVisitorState.IN_HANDLER) {
         // Запишем имя функции-обработчика
         this.handlerName = node.name;
      } else {
         identifierContext.getterContext = calculateContext(node.name, context, context.getterContext);
      }
      return super.visitIdentifierNode(node, identifierContext);
   }

   visitMemberExpressionNode(node: MemberExpressionNode, context: IExpressionVisitorContext): string {
      const expressionContext = { ...context };
      if (this.state === EventVisitorState.IN_HANDLER) {
         if (node.computed) {
            throw new Error('Имя функции-обработчика события не может быть вычисляемым');
         }
         this.state = EventVisitorState.IN_CONTEXT;
         this.handlerName = (node.property as IdentifierNode).name;
         this.context = node.object.accept(this, expressionContext) as string;
      } else if (this.state === EventVisitorState.IN_ARGUMENTS) {
         // Для аргументов не запрещаем вычисляемые поля
         expressionContext.forbidComputedMembers = false;
      }
      return super.visitMemberExpressionNode(node, expressionContext);
   }

   visitProgramNode(node: ProgramNode, context: IExpressionVisitorContext): string {
      // Ожидаем строго 1 выражение
      if (node.body.length !== 1) {
         throw new Error('Ожидалось, что обработчик события - единственное выражение');
      }
      // Начинаем читать контекст-функцию обработчика
      this.state = EventVisitorState.BEFORE_HANDLER;
      return node.body[0].accept(this, context) as string;
   }
}

const enum BindVisitorState {
   INITIAL,
   IDENTIFIER,
   MEMBER
}

export class BindExpressionVisitor extends ExpressionVisitor {

   private state: BindVisitorState = BindVisitorState.INITIAL;

   visitProgramNode(node: ProgramNode, context: IExpressionVisitorContext): string {
      this.state = BindVisitorState.INITIAL;
      return super.visitProgramNode(node, context);
   }

   visitArrayExpressionNode(node: ArrayExpressionNode, context: IExpressionVisitorContext): string {
      if (this.state === BindVisitorState.INITIAL) {
         throw new Error('Запрещено объявлять массив в корне bind-выражения');
      }
      return super.visitArrayExpressionNode(node, context);
   }

   visitObjectExpressionNode(node: ObjectExpressionNode, context: IExpressionVisitorContext): string {
      if (this.state === BindVisitorState.INITIAL) {
         throw new Error('Запрещено объявлять объект в корне bind-выражения');
      }
      return super.visitObjectExpressionNode(node, context);
   }

   visitSequenceExpressionNode(node: SequenceExpressionNode, context: IExpressionVisitorContext): string {
      if (this.state === BindVisitorState.INITIAL) {
         throw new Error('Запрещено использовать перечисление (sequence expression) в корне bind-выражения');
      }
      return super.visitSequenceExpressionNode(node, context);
   }

   visitUnaryExpressionNode(node: UnaryExpressionNode, context: IExpressionVisitorContext): string {
      if (this.state === BindVisitorState.INITIAL) {
         throw new Error('Запрещено использовать унарный оператор в корне bind-выражения');
      }
      return super.visitUnaryExpressionNode(node, context);
   }

   visitBinaryExpressionNode(node: BinaryExpressionNode, context: IExpressionVisitorContext): string {
      if (this.state === BindVisitorState.INITIAL) {
         throw new Error('Запрещено использовать бинарный оператор в корне bind-выражения');
      }
      return super.visitBinaryExpressionNode(node, context);
   }

   visitLogicalExpressionNode(node: LogicalExpressionNode, context: IExpressionVisitorContext): string {
      if (this.state === BindVisitorState.INITIAL) {
         throw new Error('Запрещено использовать логический оператор в корне bind-выражения');
      }
      return super.visitLogicalExpressionNode(node, context);
   }

   visitConditionalExpressionNode(node: ConditionalExpressionNode, context: IExpressionVisitorContext): string {
      if (this.state === BindVisitorState.INITIAL) {
         throw new Error('Запрещено использовать тернарный оператор в корне bind-выражения');
      }
      return super.visitConditionalExpressionNode(node, context);
   }

   visitCallExpressionNode(node: CallExpressionNode, context: IExpressionVisitorContext): string {
      if (this.state === BindVisitorState.INITIAL) {
         throw new Error(
            'Запрещено выполнять bind на вызов функции. Вместо a.b.c.get("field") нужно использовать a.b.c["field"]'
         );
      }
      return super.visitCallExpressionNode(node, context);
   }

   visitMemberExpressionNode(node: MemberExpressionNode, context: IExpressionVisitorContext): string {
      const isRootExpression = this.state === BindVisitorState.INITIAL;
      if (!isRootExpression) {
         return super.visitMemberExpressionNode(node, context);
      }
      this.state = BindVisitorState.MEMBER;
      // Далее копипаста метода visitMemberExpressionNode @ ExpressionVisitor
      // TODO: нужно выпрямить обход дерева
      if (node.property) {
         const { arr, dataSource } = super.processMemberProperty(node, context);
         if (arr.length === 2 && arr[0].slice(1, -1) === '_options') {
            throw new Error(
               'Запрещено использовать bind на свойства объекта _options: данный объект заморожен'
            );
         }
         return genSetter(dataSource, arr);
      }
      return node.object.accept(this, context) as string;
   }

   visitDecoratorChainCallNode(node: DecoratorChainCallNode, context: IExpressionVisitorContext): string {
      throw new Error('Запрещено использовать декораторы в bind-выражениях');
   }

   visitDecoratorChainContext(node: DecoratorChainContext, context: IExpressionVisitorContext): string {
      throw new Error('Запрещено использовать декораторы в bind-выражениях');
   }

   visitDecoratorCallNode(node: DecoratorCallNode, context: IExpressionVisitorContext): string {
      throw new Error('Запрещено использовать декораторы в bind-выражениях');
   }

   visitIdentifierNode(node: IdentifierNode, context: IExpressionVisitorContext): string {
      const isRootExpression = this.state === BindVisitorState.INITIAL;
      if (!isRootExpression) {
         return super.visitIdentifierNode(node, context);
      }
      this.state = BindVisitorState.IDENTIFIER;
      return resolveIdentifierSetter(node, context.data, false, context.getterContext);
   }

   visitLiteralNode(node: LiteralNode, context: IExpressionVisitorContext): string {
      if (this.state === BindVisitorState.INITIAL) {
         throw new Error('Запрещено выполнять bind на литералы');
      }
      return super.visitLiteralNode(node, context);
   }
}

export interface IWalkerHooks {
   [nodeType: string]: (node: Node, context: IExpressionVisitorContext) => void;
}

/**
 * Обойти дерево выражения Program Node, выполнив callback-функции на нужных узлах.
 * @param expression Program Node выражение.
 * @param cbs Объект callback-функций.
 */
export class Walker implements IExpressionVisitor<IExpressionVisitorContext, void> {
   readonly hooks: IWalkerHooks;

   constructor(hooks: IWalkerHooks) {
      this.hooks = hooks;
   }

   visitArrayExpressionNode(node: ArrayExpressionNode, context: IExpressionVisitorContext): void {
      node.elements.forEach(
         (element: Node) => element.accept(this, context)
      );
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitBinaryExpressionNode(node: BinaryExpressionNode, context: IExpressionVisitorContext): void {
      node.left.accept(this, context);
      node.right.accept(this, context);
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitCallExpressionNode(node: CallExpressionNode, context: IExpressionVisitorContext): void {
      node.callee.accept(this, context);
      if (node.arguments) {
         node.arguments.forEach(
            (argument: Node) => argument.accept(this, context)
         );
      }
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitConditionalExpressionNode(node: ConditionalExpressionNode, context: IExpressionVisitorContext): void {
      node.test.accept(this, context);
      if (node.alternate) {
         node.alternate.accept(this, context);
      }
      node.consequent.accept(this, context);
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitDecoratorCallNode(node: DecoratorCallNode, context: IExpressionVisitorContext): void {
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitDecoratorChainCallNode(node: DecoratorChainCallNode, context: IExpressionVisitorContext): void {
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitDecoratorChainContext(node: DecoratorChainContext, context: IExpressionVisitorContext): void {
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitEmptyStatementNode(node: EmptyStatementNode, context: IExpressionVisitorContext): void {
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitExpressionBrace(node: ExpressionBrace, context: IExpressionVisitorContext): void {
      node.name.accept(this, context);
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitExpressionStatementNode(node: ExpressionStatementNode, context: IExpressionVisitorContext): void {
      node.expression.accept(this, context);
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitIdentifierNode(node: IdentifierNode, context: IExpressionVisitorContext): void {
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitLiteralNode(node: LiteralNode, context: IExpressionVisitorContext): void {
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitLogicalExpressionNode(node: LogicalExpressionNode, context: IExpressionVisitorContext): void {
      node.left.accept(this, context);
      node.right.accept(this, context);
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitMemberExpressionNode(node: MemberExpressionNode, context: IExpressionVisitorContext): void {
      node.object.accept(this, context);
      if (node.computed) {
         node.property.accept(this, context);
      }
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitObjectExpressionNode(node: ObjectExpressionNode, context: IExpressionVisitorContext): void {
      node.properties.forEach((property: IObjectProperty) => {
         const key = property.key;
         const value = property.value;
         key.accept(this, context);
         value.accept(this, context);
      });
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitProgramNode(node: ProgramNode, context: IExpressionVisitorContext): void {
      node.body.forEach(
         (expression: Node) => expression.accept(this, context)
      );
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitSequenceExpressionNode(node: SequenceExpressionNode, context: IExpressionVisitorContext): void {
      node.expressions.forEach(
         (expression: Node) => expression.accept(this, context)
      );
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitThisExpressionNode(node: ThisExpressionNode, context: IExpressionVisitorContext): void {
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }

   visitUnaryExpressionNode(node: UnaryExpressionNode, context: IExpressionVisitorContext): void {
      node.argument.accept(this, context);
      if (this.hooks[node.type]) {
         this.hooks[node.type](node, context);
      }
   }
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

interface IObjectProperty {
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
