import { InternalNode, InternalNodeType, IProgramMeta } from '../core/Internal';
import { ExpressionVisitor } from '../expressions/Nodes';
import { canUseNewInternalMechanism } from '../core/Internal';

//#region Constants

/**
 * Флаг включения/выключения генерации internal-функций.
 */
const USE_INTERNAL_FUNCTIONS = true;

/**
 * Флаг генерации условных конструкций
 */
const ALLOW_CONDITIONS = true;

/**
 * Если false, то перед вызовом функции только (!) в не оригинальном контексте будет сначала вычисляться возможность вызова функции:
 * (функция !== undef) && (все аргументы !== undef).
 * Если true, то перед вызовом функции в любом (!) контексте сначала будет вычисляться возможность вызова функции.
 */
const ALWAYS_FOREIGN_CONTAINER: boolean = true;

const FUNCTION_PREFIX = '__$calculateDirtyCheckingVars_';
const INTERNAL_PROGRAM_PREFIX = '__dirtyCheckingVars_';
const COLLECTION_NAME = 'collection';
const CONDITIONAL_VARIABLE_NAME = 'condition';
const SAFE_CHECK_VARIABLE_NAME = 'safeCheck';
const CONTEXT_VARIABLE_NAME = 'data';
// FIXME: переменная funcContext неправильно вставлена в генератор кода mustache-выражения
const FUNCTION_HEAD = `var funcContext=${CONTEXT_VARIABLE_NAME};var ${COLLECTION_NAME}={};`;
const FUNCTION_TAIL = `return ${COLLECTION_NAME};`;

//#endregion

interface IOptions {

    // Индекс родительского контейнера. Необходим для контроля межконтейнерных вычислений, чтобы проверять
    // выражение гарантированно вычислимо или нет.
    rootIndex: number;

    // Имя переменной для self-check проверок при генерации internal
    safeCheckVariable: string | null;
}

export function canUseNewInternalFunctions(): boolean {
    return canUseNewInternalMechanism() && USE_INTERNAL_FUNCTIONS;
}

export function generate(node: InternalNode, functions: Function[]): string {
    if (isEmpty(node)) {
        return '{}';
    }
    if (node.index === -1) {
        throw new Error('Произведена попытка генерации Internal-функции от скрытого узла');
    }
    const options: IOptions = {
        rootIndex: node.index,
        safeCheckVariable: null
    };
    const functionName = FUNCTION_PREFIX + node.index;
    const body = FUNCTION_HEAD + buildAll([node], options) + FUNCTION_TAIL;
    const index = node.ref.getCommittedIndex(body);
    if (index !== null) {
        return FUNCTION_PREFIX + index + `(${CONTEXT_VARIABLE_NAME})`;
    }
    try {
        const func = new Function(CONTEXT_VARIABLE_NAME, body);
        Object.defineProperty(func, 'name', { value: functionName, configurable: true });
        appendFunction(func, functions);
        node.ref.commitCode(node.index, body);
        return functionName + `(${CONTEXT_VARIABLE_NAME})`;
    } catch (error) {
        throw new Error(`Тело функции "${functionName}" невалидно: ${error.message}`);
    }
 }

 function isEmpty(node: InternalNode): boolean {
    // TODO: Optimize!!!
    return node.flatten().length === 0;
 }

 function appendFunction(func: Function, functions: Function[]): void {
    const index = functions.findIndex((item: Function) => func.name === item.name);
    if (index > -1) {
        return;
    }
    functions.unshift(func);
 }

 function build(node: InternalNode, options: IOptions): string {
    const body = buildPrograms(node.storage.getMeta(), options) + buildAll(node.children, options);
    if (node.type === InternalNodeType.IF || node.type === InternalNodeType.ELSE_IF) {
        const test = buildMeta(node.test, options);
        const prefix = wrapProgram(node.test, test);
        return prefix + body;
    }
    return body;
}

function getCurrentConditionalIndex(node: InternalNode): number {
    if (node.type === InternalNodeType.IF) {
        return node.index;
    }
    if (node.type === InternalNodeType.BLOCK) {
        throw new Error(`Произведена попытка получения индекса условного узла от блока с номером ${node.index}`);
    }
    if (node.prev === null) {
        throw new Error(`Узел типа IF недостижим. Текущий internal узел - ${node.index}`);
    }
    return getCurrentConditionalIndex(node.prev);
}

function generateConditionalVariableName(node: InternalNode): string {
    return `${CONDITIONAL_VARIABLE_NAME}_${getCurrentConditionalIndex(node)}`;
}

function generateSafeCheckVariableName(node: InternalNode): string {
    return `${SAFE_CHECK_VARIABLE_NAME}_${getCurrentConditionalIndex(node)}`;
}

function buildWithConditions(node: InternalNode, options: IOptions): string {
    const body = buildPrograms(node.storage.getMeta(), options) + buildAll(node.children, options);
    if (node.type === InternalNodeType.BLOCK) {
        return body;
    }
    const conditionalVariable = generateConditionalVariableName(node);
    const safeCheckVariable = generateSafeCheckVariableName(node);
    if (node.type === InternalNodeType.ELSE) {
        if (body.length === 0) {
            return body;
        }
        return `if((!${safeCheckVariable})||(!${conditionalVariable})){${body}}`;
    }
    const test = buildMeta(node.test, {
        ...options,
        safeCheckVariable
    });
    const prefix = wrapProgram(node.test, conditionalVariable);
    const declareVariables = `var ${conditionalVariable};var ${safeCheckVariable} = true;`;
    const safeCheck = `(!${safeCheckVariable})`;
    const undefinedConditionalCheck = `(${safeCheckVariable}=(${safeCheckVariable}||typeof(${conditionalVariable}) === 'undefined'))`;
    const conditional = `(${conditionalVariable}=(${test}))`;
    if (node.type === InternalNodeType.IF) {
        const testExpression = `${conditional}||${safeCheck}||${undefinedConditionalCheck}`;
        return `${declareVariables}if(${testExpression}){${prefix + body}}`;
    }
    if (node.type === InternalNodeType.ELSE_IF) {
        const elseConditional = `(!${conditionalVariable})&&${conditional}`;
        const testExpression = `${safeCheck}||${elseConditional}||${safeCheck}||${undefinedConditionalCheck}`;
        return `if(${testExpression}){${prefix + body}}`;
    }
    throw new Error(`Получен неизвестный internal-узел с номером ${node.index}`);
 }

 function buildAll(nodes: InternalNode[], options: IOptions): string {
    let body = '';
    for (let index = 0; index < nodes.length; ++index) {
        if (ALLOW_CONDITIONS) {
            body += buildWithConditions(nodes[index], options);
            continue;
        }
        body += build(nodes[index], options);
    }
    return body;
 }

 function buildPrograms(programs: IProgramMeta[], options: IOptions): string {
    let body = '';
    let code;
    for (let index = 0; index < programs.length; ++index) {
        code = buildMeta(programs[index], options);
        body += wrapProgram(programs[index], code);
    }
    return body;
 }

 function wrapProgram(meta: IProgramMeta, code: string): string {
    return `${COLLECTION_NAME}.${INTERNAL_PROGRAM_PREFIX}${meta.index}=${code};`;
 }

 function buildMeta(meta: IProgramMeta, options: IOptions): string {
    const context = {
       fileName: '[[internal]]',
       attributeName: meta.name,
       isControl: false,
       isExprConcat: false,
       configObject: {},
       escape: false,
       sanitize: true,
       getterContext: CONTEXT_VARIABLE_NAME,
       forbidComputedMembers: false,
       childrenStorage: [],
       checkChildren: false,

       // Если выражение вычисляется в своем настоящем контексте, то префикс перед вызовом функции не нужен
       isDirtyChecking: meta.processingIndex === options.rootIndex || ALWAYS_FOREIGN_CONTAINER
    };
    return meta.node.accept(new ExpressionVisitor(), context) as string;
}