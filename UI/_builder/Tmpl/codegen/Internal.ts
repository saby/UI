import { InternalNode, InternalNodeType, IProgramMeta } from "UI/_builder/Tmpl/core/Internal";
import { ExpressionVisitor, ProgramNode } from "UI/_builder/Tmpl/expressions/_private/Nodes";

const FUNCTION_PREFIX = '__$calculateDirtyCheckingVars_';
const INTERNAL_PROGRAM_PREFIX = '__dirtyCheckingVars_';
const COLLECTION_NAME = 'collection';
const CONDITIONAL_VARIABLE_NAME = 'temp';
const CONTEXT_VARIABLE_NAME = 'data';
// FIXME: переменная funcContext неправильно вставлена в генератор кода mustache-выражения
const FUNCTION_HEAD = `var funcContext=${CONTEXT_VARIABLE_NAME};var ${COLLECTION_NAME}={};var ${CONDITIONAL_VARIABLE_NAME};`;
const FUNCTION_TAIL = `return ${COLLECTION_NAME};`;
const USE_INTERNAL_FUNCTIONS = true;

export function isUseNewInternalFunctions(): boolean {
   return USE_INTERNAL_FUNCTIONS;
}

export function generate(node: InternalNode, functions: Function[]): string {
   if (isEmpty(node)) {
      return '{}';
   }
   if (node.index === -1) {
      throw new Error('Произведена попытка генерации Internal-функции от скрытого узла');
   }
   const functionName = FUNCTION_PREFIX + node.index;
   const body = FUNCTION_HEAD + build(node) + FUNCTION_TAIL;
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

function build(node: InternalNode): string {
   const body = buildPrograms(node.storage.getMeta()) + buildAll(node.children);
   if (node.type === InternalNodeType.IF) {
      const test = buildProgram(node.test.node, null, true);
      let prefix = wrapProgram(node.test, CONDITIONAL_VARIABLE_NAME);
      return `if((${CONDITIONAL_VARIABLE_NAME}=(${test}))){${prefix + body}}`;
   }
   if (node.type === InternalNodeType.ELSE_IF) {
      const test = buildProgram(node.test.node, null, true);
      let prefix = wrapProgram(node.test, CONDITIONAL_VARIABLE_NAME);
      return `else if((${CONDITIONAL_VARIABLE_NAME}=(${test}))){${prefix + body}}`;
   }
   if (node.type === InternalNodeType.ELSE && body.length > 0) {
      return `else{${body}}`;
   }
   return body;
}

function buildAll(nodes: InternalNode[]): string {
   let body = '';
   for (let index = 0; index < nodes.length; ++index) {
      body += build(nodes[index]);
   }
   return body;
}

function buildPrograms(programs: IProgramMeta[]): string {
   let body = '';
   let code;
   for (let index = 0; index < programs.length; ++index) {
      code = buildMeta(programs[index]);
      body += wrapProgram(programs[index], code);
   }
   return body;
}

function wrapProgram(meta: IProgramMeta, code: string): string {
   return `${COLLECTION_NAME}.${INTERNAL_PROGRAM_PREFIX}${meta.index}=${code};`;
}

function buildMeta(meta: IProgramMeta): string {
   return buildProgram(meta.node, meta.name);
}

function buildProgram(program: ProgramNode, attributeName: string | null, concatDirtyCheckingArgsWithOR: boolean = false): string {
   const context = {
      fileName: '[[internal]]',
      attributeName,
      concatDirtyCheckingArgsWithOR,
      isControl: false,
      isExprConcat: false,
      configObject: {},
      escape: false,
      sanitize: true,
      getterContext: CONTEXT_VARIABLE_NAME,
      forbidComputedMembers: false,
      childrenStorage: [],
      checkChildren: false,
      isDirtyChecking: true
   };
   return program.accept(new ExpressionVisitor(), context) as string;
}
