import { createErrorHandler } from 'Compiler/utils/ErrorHandler';
import { getDotsScopeSubstitution } from 'Compiler/codegen/Compatible';
import { genDecorate, genGetter, genSetter } from 'Compiler/codegen/TClosure';
import * as FSC from 'Compiler/modules/data/utils/functionStringCreator';
import * as common from 'Compiler/modules/utils/common';
import * as decorators from 'Compiler/expressions/Decorators';
import * as N from 'Compiler/expressions/Nodes';
import * as Walkers from 'Compiler/expressions/Walkers';

const errorHandler = createErrorHandler(true);

export interface IExpressionVisitorContext extends N.IContext {
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
    safeCheckVariable: string | null;
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
    node: N.IdentifierNode,
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
    node: N.IdentifierNode,
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
    node: N.IdentifierNode,
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

export interface IMemberPropertyResult {
    arr: string[];
    dataSource: string;
}

export class ExpressionVisitor implements N.IExpressionVisitor<IExpressionVisitorContext, string> {
    processUnescapedHtmlFunction(args: N.Node[], context: IExpressionVisitorContext): string {
        let res = '';
        if (args && args.length > 0) {
            const argument = args[0];
            res = argument.accept(this, context) as string;
            context.escape = false;
            context.sanitize = false;
        }
        return res;
    }

    processMemberProperty(node: N.MemberExpressionNode, context: IExpressionVisitorContext): IMemberPropertyResult {
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
                arr.unshift(FSC.wrapAroundQuotes((obj.property as N.IdentifierNode).name));
            }
            obj = obj.object as N.MemberExpressionNode;
        }
        if (obj.type === 'Identifier') {
            const identifierNode = ((obj as unknown) as N.IdentifierNode);
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

    buildArgumentsArray(args: N.Node[], context: IExpressionVisitorContext): string {
        const elements = args.map((node: N.Node) => node.accept(this, context)).toString();
        return `[${elements}]`;
    }

    buildSafeCheckArgumentsChain(args: N.Node[], context: IExpressionVisitorContext): string {
        let result = '';
        let counter = 0;
        for (let index = 0; index < args.length; ++index) {
            const itemCheck = args[index].accept(this, context);
            const hasFunctionCall = Walkers.containsFunctionCall(args[index], context.fileName);
            if (typeof itemCheck === 'string' && itemCheck.indexOf('thelpers.getter') > -1) {
                if (counter > 0) {
                    result += '&&';
                }
                result += `(${itemCheck})`;
                if (!hasFunctionCall) {
                    result += '!==undefined';
                }
                ++counter;
            }
        }
        return result;
    }

    visitArrayExpressionNode(node: N.ArrayExpressionNode, context: IExpressionVisitorContext): string {
        const elements = node.elements.map(
            (element: N.Node) => repairValue(element.accept(this, context), node.type)
        );
        return FSC.getStr(elements);
    }

    visitBinaryExpressionNode(node: N.BinaryExpressionNode, context: IExpressionVisitorContext): string {
        const left = node.left.accept(this, context);
        const right = node.right.accept(this, context);
        return left + node.operator + right;
    }

    visitCallExpressionNode(node: N.CallExpressionNode, context: IExpressionVisitorContext): string {
        const callee = node.callee.accept(this, context);
        if (callee) {
            if (callee === SET_HTML_UNSAFE) {
                return this.processUnescapedHtmlFunction(node.arguments, context);
            }
            const args = this.buildArgumentsArray(node.arguments, context);
            // FIXME: Use instanceof
            let object: string = 'funcContext';
            if (node.callee.type === 'MemberExpression') {
                const calleeNode = node.callee as N.MemberExpressionNode;
                object = calleeNode.object.accept(this, context) as string;
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
                const functionSafeCheck = `(${callee}) !== undefined`;
                const argsSafeCheck = this.buildSafeCheckArgumentsChain(node.arguments, context);
                let safeCheckExpression = functionSafeCheck;
                if (argsSafeCheck.length > 0) {
                    safeCheckExpression += `&&${argsSafeCheck}`;
                }
                if (context.isDirtyChecking && typeof context.safeCheckVariable === 'string') {
                    return `(((${context.safeCheckVariable})=(${safeCheckExpression}))&&${callee}.apply(${object}, ${args}))`;
                }
                return `(${safeCheckExpression}&&${callee}.apply(${object}, ${args}))`;
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

    visitConditionalExpressionNode(node: N.ConditionalExpressionNode, context: IExpressionVisitorContext): string {
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

    visitDecoratorCallNode(node: N.DecoratorCallNode, context: IExpressionVisitorContext): string {
        context.caller = node.caller
            ?  node.caller.accept(this, context) as string
            : undefined;
        const val = node.decorator.accept(this, context) as string;
        const decoratorAsChainContext = (node.decorator as N.DecoratorChainContext).fn;
        const chainContextAsIdentifier = (decoratorAsChainContext as N.DecoratorChainCallNode).identifier;
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

    visitDecoratorChainCallNode(node: N.DecoratorChainCallNode, context: IExpressionVisitorContext): string {
        const caller = context.caller;
        const decArgs = (node.argumentsDecorator || []).map((arg: N.Node) => arg.accept(this, context));
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

    visitDecoratorChainContext(node: N.DecoratorChainContext, context: IExpressionVisitorContext): string {
        if (node.entity) {
            context.caller =  node.entity.accept(this, context) as string;
            return node.fn.accept(this, context) as string;
        }
        return node.fn.accept(this, context) as string;
    }

    visitEmptyStatementNode(node: N.EmptyStatementNode, context: IExpressionVisitorContext): string {
        return '';
    }

    visitExpressionBrace(node: N.ExpressionBrace, context: IExpressionVisitorContext): string {
        const expression = node.name.accept(this, context);
        return `(${expression})`;
    }

    visitExpressionStatementNode(node: N.ExpressionStatementNode, context: IExpressionVisitorContext): string {
        return node.expression.accept(this, context) as string;
    }

    visitIdentifierNode(node: N.IdentifierNode, context: IExpressionVisitorContext): string {
        return resolveIdentifier(node, context.data, false, context.getterContext);
    }

    visitLiteralNode(node: N.LiteralNode, context: IExpressionVisitorContext): string {
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

    visitLogicalExpressionNode(node: N.LogicalExpressionNode, context: IExpressionVisitorContext): string {
        const left = node.left.accept(this, context);
        const right = node.right.accept(this, context);
        return left + node.operator + right;
    }

    visitMemberExpressionNode(node: N.MemberExpressionNode, context: IExpressionVisitorContext): string {
        if (node.property) {
            const { arr, dataSource } = this.processMemberProperty(node, context);
            return genGetter(dataSource, arr);
        }
        return node.object.accept(this, context) as string;
    }

    visitObjectExpressionNode(node: N.ObjectExpressionNode, context: IExpressionVisitorContext): string {
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

    visitProgramNode(node: N.ProgramNode, context: IExpressionVisitorContext): string {
        context.isExprConcat = node.body.length > 1;
        // FIXME: Не поддерживается наличие в body более чем 1 выражения. Нужен вывод предупреждения?
        //  Больше одного выражения - это когда они разделены ';'.
        return node.body[0].accept(this, context) as string;
    }

    visitSequenceExpressionNode(node: N.SequenceExpressionNode, context: IExpressionVisitorContext): string {
        return node.expressions.map((expression: N.Node) => expression.accept(this, context)).join(', ');
    }

    visitThisExpressionNode(node: N.ThisExpressionNode, context: IExpressionVisitorContext): string {
        return 'this';
    }

    visitUnaryExpressionNode(node: N.UnaryExpressionNode, context: IExpressionVisitorContext): string {
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

    visit(program: N.ProgramNode, context: IExpressionVisitorContext): IEventArtifact {
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

    visitCallExpressionNode(node: N.CallExpressionNode, context: IExpressionVisitorContext): string {
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
        this.args = node.arguments.map((arg: N.Node): string => `${arg.accept(this, argsContext)}`);
        this.state = EventVisitorState.AFTER_HANDLER;
        return callee as string;
    }

    visitIdentifierNode(node: N.IdentifierNode, context: IExpressionVisitorContext): string {
        const identifierContext = { ...context };
        if (this.state === EventVisitorState.IN_HANDLER) {
            // Запишем имя функции-обработчика
            this.handlerName = node.name;
        } else {
            identifierContext.getterContext = calculateContext(node.name, context, context.getterContext);
        }
        return super.visitIdentifierNode(node, identifierContext);
    }

    visitMemberExpressionNode(node: N.MemberExpressionNode, context: IExpressionVisitorContext): string {
        const expressionContext = { ...context };
        if (this.state === EventVisitorState.IN_HANDLER) {
            if (node.computed) {
                throw new Error('Имя функции-обработчика события не может быть вычисляемым');
            }
            this.state = EventVisitorState.IN_CONTEXT;
            this.handlerName = (node.property as N.IdentifierNode).name;
            this.context = node.object.accept(this, expressionContext) as string;
        } else if (this.state === EventVisitorState.IN_ARGUMENTS) {
            // Для аргументов не запрещаем вычисляемые поля
            expressionContext.forbidComputedMembers = false;
        }
        return super.visitMemberExpressionNode(node, expressionContext);
    }

    visitProgramNode(node: N.ProgramNode, context: IExpressionVisitorContext): string {
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

    visitProgramNode(node: N.ProgramNode, context: IExpressionVisitorContext): string {
        this.state = BindVisitorState.INITIAL;
        return super.visitProgramNode(node, context);
    }

    visitArrayExpressionNode(node: N.ArrayExpressionNode, context: IExpressionVisitorContext): string {
        if (this.state === BindVisitorState.INITIAL) {
            throw new Error('Запрещено объявлять массив в корне bind-выражения');
        }
        return super.visitArrayExpressionNode(node, context);
    }

    visitObjectExpressionNode(node: N.ObjectExpressionNode, context: IExpressionVisitorContext): string {
        if (this.state === BindVisitorState.INITIAL) {
            throw new Error('Запрещено объявлять объект в корне bind-выражения');
        }
        return super.visitObjectExpressionNode(node, context);
    }

    visitSequenceExpressionNode(node: N.SequenceExpressionNode, context: IExpressionVisitorContext): string {
        if (this.state === BindVisitorState.INITIAL) {
            throw new Error('Запрещено использовать перечисление (sequence expression) в корне bind-выражения');
        }
        return super.visitSequenceExpressionNode(node, context);
    }

    visitUnaryExpressionNode(node: N.UnaryExpressionNode, context: IExpressionVisitorContext): string {
        if (this.state === BindVisitorState.INITIAL) {
            throw new Error('Запрещено использовать унарный оператор в корне bind-выражения');
        }
        return super.visitUnaryExpressionNode(node, context);
    }

    visitBinaryExpressionNode(node: N.BinaryExpressionNode, context: IExpressionVisitorContext): string {
        if (this.state === BindVisitorState.INITIAL) {
            throw new Error('Запрещено использовать бинарный оператор в корне bind-выражения');
        }
        return super.visitBinaryExpressionNode(node, context);
    }

    visitLogicalExpressionNode(node: N.LogicalExpressionNode, context: IExpressionVisitorContext): string {
        if (this.state === BindVisitorState.INITIAL) {
            throw new Error('Запрещено использовать логический оператор в корне bind-выражения');
        }
        return super.visitLogicalExpressionNode(node, context);
    }

    visitConditionalExpressionNode(node: N.ConditionalExpressionNode, context: IExpressionVisitorContext): string {
        if (this.state === BindVisitorState.INITIAL) {
            throw new Error('Запрещено использовать тернарный оператор в корне bind-выражения');
        }
        return super.visitConditionalExpressionNode(node, context);
    }

    visitCallExpressionNode(node: N.CallExpressionNode, context: IExpressionVisitorContext): string {
        if (this.state === BindVisitorState.INITIAL) {
            throw new Error(
                'Запрещено выполнять bind на вызов функции. Вместо a.b.c.get("field") нужно использовать a.b.c["field"]'
            );
        }
        return super.visitCallExpressionNode(node, context);
    }

    visitMemberExpressionNode(node: N.MemberExpressionNode, context: IExpressionVisitorContext): string {
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

    visitDecoratorChainCallNode(node: N.DecoratorChainCallNode, context: IExpressionVisitorContext): string {
        throw new Error('Запрещено использовать декораторы в bind-выражениях');
    }

    visitDecoratorChainContext(node: N.DecoratorChainContext, context: IExpressionVisitorContext): string {
        throw new Error('Запрещено использовать декораторы в bind-выражениях');
    }

    visitDecoratorCallNode(node: N.DecoratorCallNode, context: IExpressionVisitorContext): string {
        throw new Error('Запрещено использовать декораторы в bind-выражениях');
    }

    visitIdentifierNode(node: N.IdentifierNode, context: IExpressionVisitorContext): string {
        const isRootExpression = this.state === BindVisitorState.INITIAL;
        if (!isRootExpression) {
            return super.visitIdentifierNode(node, context);
        }
        this.state = BindVisitorState.IDENTIFIER;
        return resolveIdentifierSetter(node, context.data, false, context.getterContext);
    }

    visitLiteralNode(node: N.LiteralNode, context: IExpressionVisitorContext): string {
        if (this.state === BindVisitorState.INITIAL) {
            throw new Error('Запрещено выполнять bind на литералы');
        }
        return super.visitLiteralNode(node, context);
    }
}