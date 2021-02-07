import { InternalNode, InternalNodeType, IProgramMeta } from '../core/Internal';
import { ExpressionVisitor, ProgramNode } from '../expressions/_private/Nodes';
import { isUseNewInternalMechanism } from '../core/Internal';

const FUNCTION_PREFIX = '__$calculateDirtyCheckingVars_';
const INTERNAL_PROGRAM_PREFIX = '__dirtyCheckingVars_';
const COLLECTION_NAME = 'collection';
const CONDITIONAL_VARIABLE_NAME = 'temp';
const CONTEXT_VARIABLE_NAME = 'data';
// FIXME: переменная funcContext неправильно вставлена в генератор кода mustache-выражения
const FUNCTION_HEAD = `var funcContext=${CONTEXT_VARIABLE_NAME};var ${COLLECTION_NAME}={};var ${CONDITIONAL_VARIABLE_NAME};`;
const FUNCTION_TAIL = `return ${COLLECTION_NAME};`;

/**
 * Флаг включения/выключения генерации internal-функций.
 */
const USE_INTERNAL_FUNCTIONS = true;

/**
 * Если false, то перед вызовом функции только (!) в не оригинальном контексте будет сначала вычисляться возможность вызова функции:
 * (функция !== undef) && (все аргументы !== undef).
 * Если true, то перед вызовом функции в любом (!) контексте сначала будет вычисляться возможность вызова функции.
 */
const ALWAYS_FOREIGN_CONTAINER: boolean = true;

export function isUseNewInternalFunctions(): boolean {
   return isUseNewInternalMechanism() && USE_INTERNAL_FUNCTIONS;
}

interface IOptions {

   // Индекс родительского контейнера. Необходим для контроля межконтейнерных вычислений, чтобы проверять
   // выражение гарантированно вычислимо или нет.
   rootIndex: number;
}

export function generate(node: InternalNode, functions: Function[]): string {
   if (isEmpty(node)) {
      return '{}';
   }
   if (node.index === -1) {
      throw new Error('Произведена попытка генерации Internal-функции от скрытого узла');
   }
   const options: IOptions = {
      rootIndex: node.index
   };
   const functionName = FUNCTION_PREFIX + node.index;
   const body = FUNCTION_HEAD + build(node, options) + FUNCTION_TAIL;
   const index = node.ref.getCommittedIndex(body);
   if (index !== null) {
      return FUNCTION_PREFIX + index + `(${CONTEXT_VARIABLE_NAME})`;
   }
   try {
      const func = new Function(CONTEXT_VARIABLE_NAME, body);
      Object.defineProperty(func, 'name', { 'value': functionName, configurable: true });
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
   if (node.type === InternalNodeType.IF) {
      const test = buildProgram(node.test.node, null, node.test.processingIndex === options.rootIndex);
      let prefix = wrapProgram(node.test, CONDITIONAL_VARIABLE_NAME);
      return `if((${CONDITIONAL_VARIABLE_NAME}=(${test}))){${prefix + body}}`;
   }
   if (node.type === InternalNodeType.ELSE_IF) {
      const test = buildProgram(node.test.node, null, node.test.processingIndex === options.rootIndex);
      let prefix = wrapProgram(node.test, CONDITIONAL_VARIABLE_NAME);
      return `else if((${CONDITIONAL_VARIABLE_NAME}=(${test}))){${prefix + body}}`;
   }
   if (node.type === InternalNodeType.ELSE && body.length > 0) {
      return `else{${body}}`;
   }
   return body;
}

function buildAll(nodes: InternalNode[], options: IOptions): string {
   let body = '';
   for (let index = 0; index < nodes.length; ++index) {
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
   return buildProgram(meta.node, meta.name, meta.processingIndex === options.rootIndex);
}

function buildProgram(program: ProgramNode, attributeName: string | null, generateFunctionPrefix: boolean): string {
   const context = {
      fileName: '[[internal]]',
      attributeName,
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
      isDirtyChecking: generateFunctionPrefix || ALWAYS_FOREIGN_CONTAINER
   };
   return program.accept(new ExpressionVisitor(), context) as string;
}
