import { InternalNode, InternalNodeType, IProgramMeta } from "UI/_builder/Tmpl/core/Internal";
import { ExpressionVisitor, ProgramNode } from "UI/_builder/Tmpl/expressions/_private/Nodes";

const FUNCTION_PREFIX = '__$getInternal_';
const INTERNAL_PROGRAM_PREFIX = '__dirtyCheckingVars_';
// FIXME: переменная funcContext неправильно вставлена в генератор кода mustache-выражения
const FUNCTION_HEAD = 'var funcContext = data; var collection = { };';
const FUNCTION_TAIL = 'return collection;';
const FUNCTION_ARGUMENTS = 'data';

const USE_INTERNAL_FUNCTIONS = true;

export function isUseNewInternalFunctions(): boolean {
   return USE_INTERNAL_FUNCTIONS;
}

export function generate(node: InternalNode, functions: Function[]): string {
   if (isEmpty(node)) {
      return '{}';
   }
   // TODO: Optimize!!! There we can create duplicate internal function
   const functionName = FUNCTION_PREFIX + node.index;
   const body = FUNCTION_HEAD + build(node) + FUNCTION_TAIL;
   const func = new Function(FUNCTION_ARGUMENTS, body);
   Object.defineProperty(func, 'name', { 'value': functionName, configurable: true });
   appendFunction(func,functions);
   return functionName + '(data)';
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
      const test = buildProgram(node.test);
      return ` if(${test}){${body}}`;
   }
   if (node.type === InternalNodeType.ELSE_IF) {
      const test = buildProgram(node.test);
      return ` else if(${test}){${body}}`;
   }
   if (node.type === InternalNodeType.ELSE && body.length > 0) {
      return ` else {${body}}`;
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
   return `collection["${INTERNAL_PROGRAM_PREFIX}${meta.index}"] = ${code};`;
}

function buildMeta(meta: IProgramMeta): string {
   return buildProgram(meta.node, meta.name);
}

function buildProgram(program: ProgramNode, attributeName: string | null = null): string {
   const context = {
      fileName: '[[internal]]',
      attributeName,
      isControl: false,
      isExprConcat: false,
      configObject: {},
      escape: false,
      sanitize: true,
      getterContext: 'data',
      forbidComputedMembers: false,
      childrenStorage: [],
      checkChildren: false,
      isDirtyChecking: true
   };
   const visitor = new ExpressionVisitor();
   return program.accept(visitor, context) as string;
}
