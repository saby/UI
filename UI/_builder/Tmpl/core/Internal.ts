import * as Ast from './Ast';
import Scope from 'UI/_builder/Tmpl/core/Scope';
import { IdentifierNode, MemberExpressionNode, ProgramNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { IParser, Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';

export function canUseNewInternalMechanism(): boolean {
    return USE_INTERNAL_MECHANISM;
}

export function process(nodes: Ast.Ast[], scope: Scope): IResultTree {
    return new InternalVisitor().process(nodes, scope);
 }

//#region Constants

/**
 * Флаг включения/выключения нового механизма формирования internal-выражений для dirty checking проверок.
 */
const USE_INTERNAL_MECHANISM = false;

/**
 * Если в test-выражение вычисляется не в своем контексте, значит не гарантируется, что результат вычисления
 * этого выражения в текущем контексте будет равен результату вычисления в оригинальном контексте.
 * В таком случае необходимо выполнить разворот условной цепочки.
 */
const DROP_FOREIGN_TEST: boolean = false;

/**
 * Если в test-выражение входит переменная, которая гарантированно не может быть вычислена в данном не оригинальном контексте,
 * то выполнить дробление выражения и разворот условной цепочки.
 */
const DROP_TEST_IDENTIFIERS: boolean = true;

/**
 * Если в test-выражение входит вызов функции, который может быть не вычислена в данном не оригинальном контексте,
 * то разворот условной цепочки.
 */
const DROP_TEST_FUNCTIONS: boolean = false;

/**
 * Пропускать internal выражения контентных опций для компонента.
 */
const SKIP_CONTENT_OPTION_INTERNAL_ON_COMPONENT: boolean = true;

const PARSER = new Parser();

const FILE_NAME = '[[internal]]';

const INTERNAL_PROGRAM_PREFIX = '__dirtyCheckingVars_';

const FORBIDDEN_IDENTIFIERS = [
   '...',
   '_options',
   '_container',
   '_children',
   'rk'
];

//#endregion

//#region Private interfaces and enumerations

export interface IProgramMeta {

    // Имя атрибута, в значении которого содержится Mustache-выражение
    name: string | null;
 
    // Тип Mustache-выражения
    typeName: string;
 
    // Тип Mustache-выражения
    type: ProgramType;
 
    // Mustache-выражение
    node: ProgramNode;
 
    // Уникальный идентификатор Mustache-выражения
    index: number;
 
    // Флаг синтетического Mustache-выражения, которое было получено путем дробления bind-выражения
    // или выражения, в котором присутствуют невычислимые переменные
    isSynthetic: boolean;
 
    // Индекс контейнера, в котором произошла регистрация Mustache-выражения
    originIndex: number;
 
    // Индекс контейнера, от контекста которого будет выполнено вычисление Mustache-выражения
    processingIndex: number;
 }
 
 function createProgramMeta(
    name: string | null,
    type: ProgramType,
    node: ProgramNode,
    index: number,
    isSynthetic: boolean,
    originIndex: number,
    processingIndex: number
 ): IProgramMeta {
    return {
       typeName: ProgramType[type],
       index,
       name,
       node,
       isSynthetic,
       type,
       originIndex,
       processingIndex
    };
 }
 
 export enum InternalNodeType {
    IF,
    ELSE_IF,
    ELSE,
    BLOCK
 }
 
 enum ProgramType {
    SIMPLE,
    ATTRIBUTE,
    BIND,
    OPTION,
    EVENT,
    FLOAT
 }
 
 enum ContainerType {
    GLOBAL,
    COMPONENT,
    CONTENT_OPTION,
    TEMPLATE,
    CONDITIONAL,
    CYCLE,
    JOIN
 }

//#endregion

//#region Process and store Mustache-expression

function containsFunctionCall(program: ProgramNode, fileName: string): boolean {
    let hasFunctionCall = false;
    const callbacks = {
       CallExpression: (): void => {
          hasFunctionCall = true;
       }
    };
    const walker = new Walker(callbacks);
    program.accept(walker, {
       fileName
    });
    return hasFunctionCall;
 }
 
 function containsIdentifiers(program: ProgramNode, identifiers: string[], fileName: string): boolean {
    let hasLocalIdentifier = false;
    const callbacks = {
       Identifier: (data: IdentifierNode): void => {
          if (identifiers.indexOf(data.name) > -1) {
             hasLocalIdentifier = true;
          }
       }
    };
    const walker = new Walker(callbacks);
    program.accept(walker, {
       fileName
    });
    return hasLocalIdentifier;
 }
 
 function hasBindings(program: ProgramNode): boolean {
    if (typeof program.string !== 'string') {
       return false;
    }
    return program.string.indexOf('|mutable') > -1 || program.string.indexOf('|bind') > -1;
 }
 
 function canRegisterProgram(program: ProgramNode): boolean {
    // Do not register program with bind and mutable decorators
    return !hasBindings(program);
 }
 
 function isForbiddenIdentifier(name: string): boolean {
    return FORBIDDEN_IDENTIFIERS.indexOf(name) > -1;
 }
 
 function collectIdentifiers(program: ProgramNode, fileName: string): string[] {
    const identifiers: string[] = [];
    const callbacks = {
       Identifier: (node: IdentifierNode): void => {
          const identifier = node.name;
          // Do not produce duplicates
          if (identifiers.indexOf(identifier) === -1) {
             identifiers.push(node.name);
          }
       }
    };
    const walker = new Walker(callbacks);
    program.accept(walker, {
       fileName
    });
    return identifiers;
 }
 
 function dropBindProgram(program: ProgramNode, parser: IParser, fileName: string): ProgramNode[] {
    const programs: ProgramNode[] = [];
    const callbacks = {
       Identifier: (node: IdentifierNode): void => {
          programs.push(
             parser.parse(node.name)
          );
       },
       MemberExpression: (node: MemberExpressionNode): void => {
          programs.push(
             parser.parse(node.string)
          );
       }
    };
    const walker = new Walker(callbacks);
    program.accept(walker, {
       fileName
    });
    // We need to return value-program and object-program.
    // Ex. for "a.b.c.d.e" we only return "a.b.c.d" and "a.b.c.d.e".
    return programs.slice(-2);
 }
 
 class ProgramStorage {
    private readonly programs: IProgramMeta[];
    private readonly programsMap: Map<string, number>;
 
    constructor() {
       this.programs = [];
       this.programsMap = new Map<string, number>();
    }
 
    findIndex(program: ProgramNode): number | null {
       const source = program.string;
       if (this.programsMap.has(source)) {
          const index = this.programsMap.get(source);
          return this.programs[index].index;
       }
       return null;
    }
 
    get(program: ProgramNode): IProgramMeta | null {
       const source = program.string;
       if (!this.programsMap.has(source))  {
          return null;
       }
       const index = this.programsMap.get(source);
       return this.programs[index];
    }
 
    set(meta: IProgramMeta): void {
       const source = meta.node.string;
       // Do not append program that already exists
       if (this.programsMap.has(source)) {
          return;
       }
       // Description index in collection that will be set
       const index: number = this.programs.length;
       this.programsMap.set(source, index);
       this.programs.push(meta);
    }
 
    remove(meta: IProgramMeta): void {
       const source = meta.node.string;
       if (!this.programsMap.has(source))  {
          return;
       }
       const index = this.programsMap.get(source);
       this.programs.splice(index, 1);
       this.programsMap.forEach((value: number, key: string) => {
          if (value >= index) {
             this.programsMap.set(key, value - 1);
          }
       });
       this.programsMap.delete(source);
    }
 
    getMeta(): IProgramMeta[] {
       return Array(...this.programs);
    }
 }

//#endregion

//#region Internal node and container

class IndexAllocator {
    private index: number;
 
    constructor(index: number) {
       this.index = index;
    }
 
    allocate(): number {
       return this.index++;
    }
 }
 
 interface ICollectorOptions {
    rootIndex: number;
    depth: number;
    allocator: IndexAllocator;
    indices: Set<number>;
    removeSelfIdentifiers: boolean;
 }
 
 class Container {
    public readonly typeName: string;
    public desc: string;
 
    public readonly globalContainers: Array<Container>;
    public programCounter: number;
 
    public readonly index: number;
    public readonly type: ContainerType;
    public readonly parent: Container | null;
    public readonly children: Array<Container>;
 
    public test: IProgramMeta | null;
    public isElse: boolean;
    public isInDataType: boolean;
    public readonly selfIdentifiers: Array<string>;
    public readonly identifiers: Array<string>;
    public readonly storage: ProgramStorage;
 
    public readonly codegen: Map<number, string>;
    public readonly codegenMap: Map<string, number>;
 
    constructor(parent: Container | null, type: ContainerType) {
       this.typeName = ContainerType[type];
       this.desc = '';
 
       this.globalContainers = parent === null ? new Array<Container>() : parent.globalContainers;
       this.codegen = parent === null ? new Map<number, string>() : parent.codegen;
       this.codegenMap = parent === null ? new Map<string, number>() : parent.codegenMap;
       this.programCounter = 0;
 
       this.type = type;
       this.index = this.globalContainers.length;
       this.parent = parent;
       this.children = new Array<Container>();
 
       this.test = null;
       this.isElse = false;
       this.isInDataType = false;
       this.selfIdentifiers = new Array<string>();
       this.identifiers = new Array<string>();
       this.storage = new ProgramStorage();
 
       this.globalContainers.push(this);
       if (this.parent !== null) {
          this.parent.children.push(this);
       }
    }
 
    createContainer(type: ContainerType): Container {
       return new Container(this, type);
    }
 
    addIdentifier(identifier: string): void {
       if (this.selfIdentifiers.indexOf(identifier) === -1) {
          this.selfIdentifiers.push(identifier);
       }
       if (this.identifiers.indexOf(identifier) === -1) {
          this.identifiers.push(identifier);
       }
    }
 
    registerTestProgram(program: ProgramNode): void {
       // TODO: There can be truthy/falsy literal. Release optimization
       this.processIdentifiers(program);
       this.test = createProgramMeta(
          'data',
          ProgramType.SIMPLE,
          program,
          this.allocateProgramIndex(),
          false,
          this.index,
          this.getProcessingContainerIndex()
       );
    }
 
    registerProgram(program: ProgramNode, type: ProgramType, name: string | null): void {
       switch (type) {
          case ProgramType.SIMPLE:
          case ProgramType.ATTRIBUTE:
          case ProgramType.OPTION:
             return this.applyProgram(program, type, name, false);
          case ProgramType.BIND:
             return this.registerBindProgram(program, type, name);
          case ProgramType.EVENT:
             return this.registerEventProgram(program);
          case ProgramType.FLOAT:
             return this.registerFloatProgram(program);
          default:
             throw new Error('Получен неизвестный тип Mustache-выражения');
       }
    }
 
    getOwnIdentifiers(): string[] {
       return Array(...this.identifiers);
    }
 
    joinContainer(container: Container, identifiers: string[]): void {
       const join = new Container(this, ContainerType.JOIN);
       join.desc = `JOIN @${container.index}`;
       for (let index = 0; index < identifiers.length; ++index) {
          join.addIdentifier(identifiers[index]);
       }
       join.children.push(container);
    }
 
    getInternalStructure(removeSelfIdentifiers: boolean = false): InternalNode {
       const allocator = new IndexAllocator(this.getCurrentProgramIndex());
       const indices = new Set<number>();
       const options: ICollectorOptions = {
          rootIndex: this.index,
          depth: 0,
          allocator,
          indices,
          removeSelfIdentifiers
       };
       return this.collectInternalStructure(options);
    }
 
    commitCode(index: number, code: string): void {
       this.codegen.set(index, code);
       this.codegenMap.set(code, index);
    }
 
    getCommittedIndex(code: string): number | null {
       if (this.codegenMap.has(code)) {
          return this.codegenMap.get(code);
       }
       return null;
    }
 
    getProcessingContainerIndex(): number {
       // Здесь перечислены типы контейнеров, для которых выполняется вычисление контекста
       // Заметка: для типа CYCLE тоже выполняется вычисление контекста (добавляются index, item переменные),
       //    но для типа CYCLE выполняется контроль этих переменных - сами переменные и выражения с этими переменными
       //    не всплывают в родительские контейнеры.
       if (
          this.type === ContainerType.GLOBAL ||
          this.type === ContainerType.TEMPLATE ||
          this.type === ContainerType.CONTENT_OPTION ||
          this.parent === null
       ) {
          return this.index;
       }
       return this.parent.getProcessingContainerIndex();
    }
 
    private collectInternalStructure(options: ICollectorOptions): InternalNode {
       const node = this.createInternalNode(options);
       let prevChild: InternalNode | null = null;
       const childrenOptions: ICollectorOptions = {
          rootIndex: options.rootIndex,
          allocator: options.allocator,
          indices: options.indices,
          removeSelfIdentifiers: options.removeSelfIdentifiers,
          depth: options.depth + 1
       };
       for (let index = 0; index < this.children.length; ++index) {
          const canSkipChild = options.depth === 0
            && this.children[index].type === ContainerType.CONTENT_OPTION
            && !this.children[index].isInDataType;
          const skipChild = SKIP_CONTENT_OPTION_INTERNAL_ON_COMPONENT && canSkipChild;
          if (skipChild) {
             continue;
          }
          const child = this.children[index].collectInternalStructure(childrenOptions);
          node.children.push(child);
          child.prev = prevChild;
          if (prevChild !== null) {
             prevChild.next = child;
          }
          prevChild = child;
          child.setParent(node);
       }
       if (!options.removeSelfIdentifiers && options.depth === 0 && this.type === ContainerType.CONTENT_OPTION) {
          return node;
       }
       if (this.selfIdentifiers.length > 0) {
          node.removeIfContains(this.selfIdentifiers, options);
       }
       return node;
    }
 
    private createInternalNode(options: ICollectorOptions): InternalNode {
       const node = new InternalNode(this.index, this.getInternalNodeType(), this);
       node.test = this.test;
       node.isInDataType = this.isInDataType;
       let selfPrograms = this.storage.getMeta();
       const filterPrograms = options.depth === 0 && this.type === ContainerType.COMPONENT;
       if (filterPrograms) {
          selfPrograms = selfPrograms.filter((meta: IProgramMeta) => {
             if (meta.type === ProgramType.ATTRIBUTE) {
                // Атрибуты попадают в коллекцию атрибутов, в internal их не записываем.
                return false;
             }
             if (meta.type === ProgramType.OPTION) {
                // Все опции попадают в коллекцию опций, в internal их не записываем.
                // Исключение - опция scope, она не попадает в опции, но ее изменение нужно отследить
                return meta.name === "scope";
             }
             if (meta.type === ProgramType.BIND) {
                // Все значения bind выражений попадают в опции, в internal их не записываем.
                // Исключение - контекст bind-выражения (все синтетические выражения).
                // FIXME: DEV: REMOVE
                // return meta.isSynthetic;
             }
             return true;
          });
       }
       for (let index = 0; index < selfPrograms.length; ++index) {
          if (options.indices.has(selfPrograms[index].index)) {
             continue;
          }
          node.storage.set(selfPrograms[index]);
          options.indices.add(selfPrograms[index].index);
       }
       return node;
    }
 
    private getInternalNodeType(): InternalNodeType {
       if (this.type === ContainerType.CONDITIONAL) {
          if (this.isElse) {
             if (this.test === null) {
                return InternalNodeType.ELSE;
             }
             return InternalNodeType.ELSE_IF;
          }
          return InternalNodeType.IF;
       }
       return InternalNodeType.BLOCK;
    }
 
    private applyProgram(program: ProgramNode, type: ProgramType, name: string | null, isSynthetic: boolean): void {
       if (!canRegisterProgram(program)) {
          return;
       }
       if (!this.processIdentifiers(program)) {
          return;
       }
       const meta = createProgramMeta(
          name,
          type,
          program,
          this.allocateProgramIndex(),
          isSynthetic,
          this.index,
          this.getProcessingContainerIndex()
       );
       this.commitProgram(meta);
    }
 
    private registerBindProgram(program: ProgramNode, type: ProgramType, name: string | null): void {
       const programs = dropBindProgram(program, PARSER, FILE_NAME);
       for (let index = 0; index < programs.length; ++index) {
          const isSynthetic = index + 1 < programs.length;
          const program = programs[index];
          this.applyProgram(program, type, name, isSynthetic);
       }
    }
 
    private registerEventProgram(program: ProgramNode): void {
       this.processIdentifiers(program);
    }
 
    private registerFloatProgram(program: ProgramNode): void {
       const identifiers = collectIdentifiers(program, FILE_NAME);
       this.commitIdentifiersAsPrograms(identifiers, this.identifiers, ProgramType.FLOAT);
       for (let index = 0; index < identifiers.length; ++index) {
          const identifier = identifiers[index];
          this.hoistIdentifier(identifier);
          this.commitIdentifier(identifier);
          this.commitSelfIdentifier(identifier);
       }
    }
 
    private allocateProgramIndex(): number {
       if (this.parent === null) {
          return this.programCounter++;
       }
       return this.parent.allocateProgramIndex();
    }
 
    private getCurrentProgramIndex(): number {
       if (this.parent === null) {
          return this.programCounter;
       }
       return this.parent.getCurrentProgramIndex();
    }
 
    private processIdentifiers(program: ProgramNode): boolean {
       const identifiers = collectIdentifiers(program, FILE_NAME);
       // Do not register program without identifiers.
       if (identifiers.length === 0) {
          return false;
       }
       for (let index = 0; index < identifiers.length; ++index) {
          const identifier = identifiers[index];
          this.hoistIdentifier(identifier);
       }
       return true;
    }
 
    private hoistIdentifier(identifier: string): void {
       if (this.identifiers.indexOf(identifier) > -1 || isForbiddenIdentifier(identifier)) {
          return;
       }
       if (this.isIdentifierHoistingAllowed()) {
          this.parent.hoistIdentifier(identifier);
          return;
       }
       this.commitIdentifier(identifier);
       this.hoistReactiveIdentifier(identifier);
    }
 
    private isIdentifierHoistingAllowed(): boolean {
       return this.parent !== null && this.type !== ContainerType.TEMPLATE;
    }
 
    private commitIdentifier(identifier: string): void {
       if (this.identifiers.indexOf(identifier) > -1) {
          return;
       }
       this.identifiers.push(identifier);
    }
 
    private commitSelfIdentifier(identifier: string): void {
       if (this.selfIdentifiers.indexOf(identifier) > -1) {
          return;
       }
       this.selfIdentifiers.push(identifier);
    }
 
    private hoistReactiveIdentifier(identifier: string): void {
       if (this.parent === null) {
          this.commitIdentifier(identifier);
          return;
       }
       this.parent.hoistReactiveIdentifier(identifier);
    }
 
    private commitProgram(meta: IProgramMeta): void {
       this.storage.set(meta);
    }
 
    private commitIdentifiersAsPrograms(identifiers: string[], localIdentifiers: string[], programType: ProgramType = ProgramType.SIMPLE): void {
       for (let index = 0; index < identifiers.length; ++index) {
          const identifier = identifiers[index];
          if (this.identifiers.indexOf(identifier) > -1) {
             continue;
          }
          if (localIdentifiers.indexOf(identifier) > -1) {
             continue;
          }
          const program = PARSER.parse(identifier);
          const meta = createProgramMeta(
             null,
             programType,
             program,
             this.allocateProgramIndex(),
             true,
             this.index,
             this.getProcessingContainerIndex()
          );
          this.commitProgram(meta);
       }
    }
 }
 
 export class InternalNode {
    public readonly index: number;
 
    public isInDataType: boolean;
    public type: InternalNodeType;
    public typeName: string;
 
    public parent: InternalNode;
    public prev: InternalNode | null;
    public next: InternalNode | null;
    public children: Array<InternalNode>;
 
    public test: IProgramMeta | null;
    public storage: ProgramStorage;
 
    public ref: Container;
 
    constructor(index: number, type: InternalNodeType, ref: Container) {
       this.index = index;
       this.type = type;
       this.typeName = InternalNodeType[type];
 
       this.parent = null;
       this.prev = null;
       this.next = null;
       this.children = new Array<InternalNode>();
 
       this.test = null;
       this.storage = new ProgramStorage();
       this.ref = ref;
    }
 
    setParent(parent: InternalNode): void {
       this.parent = parent;
    }
 
    removeIfContains(identifiers: string[], options: ICollectorOptions): void {
       this.checkCleanConditional(identifiers, options);
       this.cleanStorage(identifiers, options);
       for (let index = 0; index < this.children.length; ++index) {
          this.children[index].removeIfContains(identifiers, options);
       }
    }
 
    setType(type: InternalNodeType): void {
       this.type = type;
       this.typeName = InternalNodeType[type];
    }
 
    private cleanStorage(identifiers: string[], options: ICollectorOptions): void {
       const collection = this.storage.getMeta();
       for (let index = 0; index < collection.length; ++index) {
          const meta = collection[index];
          if (meta.type === ProgramType.FLOAT && meta.isSynthetic) {
             continue;
          }
          if (containsIdentifiers(meta.node, identifiers, FILE_NAME)) {
             this.storage.remove(meta);
 
             const localIdentifiers = collectIdentifiers(meta.node, FILE_NAME);
             for (let idIndex = 0; idIndex < localIdentifiers.length; ++idIndex) {
                const identifier = localIdentifiers[idIndex];
                if (identifiers.indexOf(identifier) > -1) {
                   continue;
                }
                const program = PARSER.parse(identifier);
                const idMeta = createProgramMeta(
                   null,
                   ProgramType.SIMPLE,
                   program,
                   options.allocator.allocate(),
                   true,
                   this.ref.index,
                   this.ref.getProcessingContainerIndex()
                );
                this.storage.set(idMeta);
             }
          }
       }
    }
 
    private checkCleanConditional(identifiers: string[], options: ICollectorOptions): void {
       if (this.type === InternalNodeType.BLOCK || this.type === InternalNodeType.ELSE) {
          return;
       }
       const hasFunctionCall = containsFunctionCall(this.test.node, FILE_NAME);
       const hasLocalIdentifier = containsIdentifiers(this.test.node, identifiers, FILE_NAME);
       const isForeignTest = this.test.processingIndex !== options.rootIndex;
       if (hasLocalIdentifier && DROP_TEST_IDENTIFIERS) {
          this.dropAndAppend(identifiers, options.allocator);
       } else if (hasFunctionCall && DROP_TEST_FUNCTIONS || isForeignTest && DROP_FOREIGN_TEST) {
          this.storage.set(this.test);
       } else {
          // Do not modify conditional node
          return;
       }
       this.setType(
          this.type === InternalNodeType.ELSE_IF
             ? InternalNodeType.ELSE
             : InternalNodeType.BLOCK
       );
       this.test = null;
       if (this.next === null) {
          return;
       }
       this.next.removeSiblingConditional(this);
    }
 
    private removeSiblingConditional(parent: InternalNode, counter: number = 0): void {
       if (counter === 0) {
          if (this.type === InternalNodeType.ELSE_IF) {
             this.setType(InternalNodeType.IF);
          } else if (this.type === InternalNodeType.ELSE) {
             this.setType(InternalNodeType.BLOCK);
          } else {
             return;
          }
       }
       const index = parent.children.length;
       parent.children.push(this);
       if (this.next) {
          this.next.removeSiblingConditional(parent, counter + 1);
       }
       if (this.next === null || this.next && this.next.type === InternalNodeType.IF) {
          const startIndex = this.parent.children.indexOf(parent.children[parent.children.length - counter - 1]);
          this.parent.children.splice(startIndex, counter + 1);
       }
       this.prev = index > 0 ? parent.children[index - 1] : null;
       this.next = index + 1 < parent.children.length ? parent.children[index + 1] : null;
       this.parent = parent;
       return;
    }
 
    private dropAndAppend(identifiers: string[], allocator: IndexAllocator): void {
       if (this.test === null) {
          return;
       }
       const testIdentifiers = collectIdentifiers(this.test.node, FILE_NAME);
       for (let idIndex = 0; idIndex < testIdentifiers.length; ++idIndex) {
          const identifier = testIdentifiers[idIndex];
          if (identifiers.indexOf(identifier) > -1) {
             continue;
          }
          const program = PARSER.parse(identifier);
          const idMeta = createProgramMeta(
             null,
             ProgramType.SIMPLE,
             program,
             allocator.allocate(),
             true,
             this.ref.index,
             this.ref.getProcessingContainerIndex()
          );
          this.storage.set(idMeta);
       }
    }
 
    flatten(): IProgramMeta[] {
       return this.collectMeta(new Set<string>(), []);
    }
 
    private collectMeta(names: Set<string>, collection: IProgramMeta[]): IProgramMeta[] {
       for (let index = 0; index < this.children.length; ++index) {
          this.children[index].collectMeta(names, collection);
       }
 
       const localCollection = this.storage.getMeta();
       if (this.test) {
          localCollection.push(this.test);
       }
       for (let index = 0; index < localCollection.length; ++index) {
          if (names.has(localCollection[index].node.string)) {
             continue;
          }
          names.add(localCollection[index].node.string);
          collection.push(localCollection[index]);
       }
 
       return collection;
    }
 }

//#endregion

//#region AST Visitor helpers

declare type IProperties = Ast.IAttributes | Ast.IEvents | Ast.IOptions | Ast.IContents | Ast.IObjectProperties;

function visitAll(nodes: Ast.Ast[], visitor: Ast.IAstVisitor, context: IContext): void {
   for (let index = 0; index < nodes.length; ++index) {
      nodes[index].accept(visitor, context);
   }
}

function visitAllProperties(properties: IProperties, visitor: Ast.IAstVisitor, context: IContext): void {
   for (const name in properties) {
      properties[name].accept(visitor, context);
   }
}

function collectInlineTemplateIdentifiers(node: Ast.InlineTemplateNode): string[] {
   const identifiers = [];
   for (const name in node.__$ws_events) {
      const event = node.__$ws_events[name];
      if (event instanceof Ast.BindNode) {
         // bind:option="option" is simple alias and deep usages exist in current scope
         if (event.__$ws_property !== event.__$ws_value.string) {
            identifiers.push(event.__$ws_property);
         }
      }
   }
   for (const name in node.__$ws_options) {
      const option = node.__$ws_options[name];
      if (option.hasFlag(Ast.Flags.TYPE_CASTED | Ast.Flags.UNPACKED) && option.__$ws_value instanceof Ast.ValueNode) {
         const value = option.__$ws_value;
         const valuePart = value.__$ws_data[0];
         if (value.__$ws_data.length === 1 && valuePart instanceof Ast.ExpressionNode) {
            if (option.__$ws_name === valuePart.__$ws_program.string) {
               // Skip only case option="{{ option }}"
               continue;
            }
         }
      }
      identifiers.push(option.__$ws_name);
   }
   return identifiers;
}

function wrapInternalExpressions(programs: IProgramMeta[]): any {
   const internal = { };

   // FIXME: DEVELOP: REMOVE
   programs.sort(function(a, b) {
      if (a.node.string < b.node.string) return -1;
      if (a.node.string > b.node.string) return +1;
      return 0;
   });

   for (let index = 0; index < programs.length; ++index) {
      const program = programs[index];
      internal[INTERNAL_PROGRAM_PREFIX + index] = {
         data: [
            new Ast.ExpressionNode(program.node)
         ],
         type: 'text'
      };
   }
   return internal;
}

enum AbstractNodeType {
   ROOT,
   COMPONENT,
   COMPONENT_OPTION,
   ELEMENT,
   DATA_TYPE_DIRECTIVE,
   DIRECTIVE,
   ATTRIBUTE,
   OPTION,
   TEXT
}

function getProgramType(stack: Array<AbstractNodeType>): ProgramType {
   let isInComponent = false;
   let isInAttribute = false;
   let isInOption = false;
   for (let index = stack.length - 1; index > -1; --index) {
      if (stack[index] === AbstractNodeType.DATA_TYPE_DIRECTIVE) {
         continue;
      } else if (stack[index] === AbstractNodeType.COMPONENT) {
         isInComponent = true;
      } else if (stack[index] === AbstractNodeType.ATTRIBUTE) {
         isInAttribute = true;
         continue;
      } else if (stack[index] === AbstractNodeType.OPTION) {
         isInOption = true;
         continue;
      }
      break;
   }
   if (isInComponent) {
      if (isInAttribute) {
         return ProgramType.ATTRIBUTE;
      } else if (isInOption) {
         return ProgramType.OPTION;
      }
   }
   return ProgramType.SIMPLE;
}

function isInComponentAttributes(stack: Array<AbstractNodeType>): boolean {
   for (let index = stack.length - 1; index > -1; --index) {
      if (stack[index] === AbstractNodeType.DATA_TYPE_DIRECTIVE) {
         continue;
      }
      if (stack[index] === AbstractNodeType.COMPONENT) {
         return true;
      }
      break;
   }
   return false;
}

function isInDataTypeDirective(stack: Array<AbstractNodeType>): boolean {
   for (let index = stack.length - 1; index > -1; --index) {
      if (stack[index] === AbstractNodeType.DATA_TYPE_DIRECTIVE) {
         return true;
      }
      if (
         stack[index] === AbstractNodeType.COMPONENT ||
         stack[index] === AbstractNodeType.COMPONENT_OPTION ||
         stack[index] === AbstractNodeType.ELEMENT ||
         stack[index] === AbstractNodeType.DIRECTIVE ||
         stack[index] === AbstractNodeType.ATTRIBUTE ||
         stack[index] === AbstractNodeType.OPTION ||
         stack[index] === AbstractNodeType.TEXT
      ) {
         return false;
      }
   }
   return false;
}

/**
 * Get string value from text.
 * @param value {TText[]} Collection of text nodes.
 * @return {string | null} Returns string in case of collection has single text node.
 */
function getStringValueFromText(value: Ast.TText[]): string | null {
   if (value.length !== 1) {
      return null;
   }
   const valueNode = value[0];
   if (!(valueNode instanceof Ast.TextDataNode)) {
      return null;
   }
   return valueNode.__$ws_content;
}

/**
 * Get element name.
 * @param element {BaseHtmlElement} Element node.
 * @return {string | null} Returns element name if it exists.
 */
function getElementName(element: Ast.BaseHtmlElement): string | null {
   if (element.__$ws_attributes.hasOwnProperty('attr:name')) {
      return getStringValueFromText(element.__$ws_attributes['attr:name'].__$ws_value);
   }
   if (element.__$ws_attributes.hasOwnProperty('name')) {
      return getStringValueFromText(element.__$ws_attributes['name'].__$ws_value);
   }
   return null;
}

/**
 * Get string value from string or value node.
 * @param value {TData} Data node.
 * @return {string | null} Returns string value for string or value node.
 */
function getStringValueFromData(value: Ast.TData): string | null {
   if (value instanceof Ast.ValueNode) {
      return getStringValueFromText(value.__$ws_data);
   }
   if (value instanceof Ast.StringNode) {
      return getStringValueFromText(value.__$ws_data);
   }
   return null;
}

/**
 * Get component name.
 * @param component {BaseWasabyElement} Component node.
 * @return {string | null} Returns component name if it exists.
 */
function getComponentName(component: Ast.BaseWasabyElement): string | null {
   const elementName = getElementName(component);
   if (elementName !== null) {
      return elementName;
   }
   if (component.__$ws_options.hasOwnProperty('attr:name')) {
      return getStringValueFromData(component.__$ws_options['attr:name'].__$ws_value);
   }
   if (component.__$ws_options.hasOwnProperty('name')) {
      return getStringValueFromData(component.__$ws_options['name'].__$ws_value);
   }
   return null;
}

/**
 * Set root node flag.
 * @param nodes {Ast[]} Collection of nodes of abstract syntax tree.
 */
function setRootNodeFlags(nodes: Ast.Ast[]): void {
   nodes.forEach((node) => {
      if (node instanceof Ast.IfNode) {
         setRootNodeFlags(node.__$ws_consequent);
         return;
      }
      if (node instanceof Ast.ElseNode) {
         setRootNodeFlags(node.__$ws_consequent);
         return;
      }
      if (node instanceof Ast.ForNode) {
         setRootNodeFlags(node.__$ws_content);
         return;
      }
      if (node instanceof Ast.ForeachNode) {
         setRootNodeFlags(node.__$ws_content);
         return;
      }
      node.__$ws_isRootNode = true;
   });
}

export interface IResultTree extends Array<Ast.Ast> {

   /**
    * Child names collection.
    */
   childrenStorage: string[];

   /**
    * Reactive property names collection.
    */
   reactiveProps: string[];

   /**
    * Inline template names collection.
    */
   templateNames: string[];

   /**
    * Global lexical context.
    */
   container: Container;

   /**
    * Special flag.
    * @deprecated
    */
   __newVersion: boolean;
}

interface IContext {
   attributeName?: string;
   childrenStorage: string[];
   container: Container;
   scope: Scope;
}

//#endregion

//#region Mustache-expression collector / AST Visitor

class InternalVisitor implements Ast.IAstVisitor {

    public readonly stack: Array<AbstractNodeType>;
 
    constructor() {
       this.stack = new Array<AbstractNodeType>();
    }
 
    process(nodes: Ast.Ast[], scope: Scope): IResultTree {
       const container = new Container(null, ContainerType.GLOBAL);
       const childrenStorage: string[] = [];
       const context: IContext = {
          childrenStorage,
          container,
          scope
       };
       this.stack.push(AbstractNodeType.ROOT);
       for (let index = 0; index < nodes.length; ++index) {
            nodes[index].accept(this, context);
            if (!nodes[index].__$ws_container) {
                nodes[index].__$ws_container = container;
            }
            if (!nodes[index].__$ws_internalTree) {
                nodes[index].__$ws_internalTree = nodes[index].__$ws_container.getInternalStructure();
                nodes[index].__$ws_internal = wrapInternalExpressions(nodes[index].__$ws_internalTree.flatten());
            }
       }
       this.stack.pop();
       const result = <IResultTree>nodes;
       result.childrenStorage = childrenStorage;
       result.reactiveProps = container.getOwnIdentifiers();
       result.templateNames = scope.getTemplateNames();
       result.container = container;
       result.__newVersion = true;
       return result;
    }
 
    visitAttribute(node: Ast.AttributeNode, context: IContext): void {
       const childContext: IContext = {
          childrenStorage: context.childrenStorage,
          container: context.container,
          scope: context.scope,
          attributeName: node.__$ws_name
       };
       this.stack.push(AbstractNodeType.ATTRIBUTE);
       visitAll(node.__$ws_value, this, childContext);
       this.stack.pop();
    }
 
    visitOption(node: Ast.OptionNode, context: IContext): void {
       const childContext: IContext = {
          childrenStorage: context.childrenStorage,
          container: context.container,
          scope: context.scope,
          attributeName: node.__$ws_name
       };
       this.stack.push(AbstractNodeType.OPTION);
       node.__$ws_value.accept(this, childContext);
       this.stack.pop();
    }
 
    visitContentOption(node: Ast.ContentOptionNode, context: IContext): void {
       const container = context.container.createContainer(ContainerType.CONTENT_OPTION);
       container.addIdentifier(node.__$ws_name);
       container.desc = node.__$ws_name;
       container.isInDataType = isInDataTypeDirective(this.stack);
       const childContext: IContext = {
          childrenStorage: context.childrenStorage,
          container,
          scope: context.scope
       };
       this.stack.push(AbstractNodeType.COMPONENT_OPTION);
       visitAll(node.__$ws_content, this, childContext);
       setRootNodeFlags(node.__$ws_content);
       this.stack.pop();
       
       node.__$ws_container = container;
       node.__$ws_internalTree = container.getInternalStructure(true);
       node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }
 
    visitBind(node: Ast.BindNode, context: IContext): void {
       const isInComponent = isInComponentAttributes(this.stack);
       const programName = isInComponent ? node.__$ws_property : null;
       context.container.registerProgram(node.__$ws_value, ProgramType.BIND, programName);
    }
 
    visitEvent(node: Ast.EventNode, context: IContext): void {
       const isInComponent = isInComponentAttributes(this.stack);
       const programName = isInComponent ? node.__$ws_event : null;
       context.container.registerProgram(node.__$ws_handler, ProgramType.EVENT, programName);
    }
 
    visitElement(node: Ast.ElementNode, context: IContext): void {
       const name = getElementName(node);
       if (name !== null) {
          context.childrenStorage.push(name);
       }
       this.stack.push(AbstractNodeType.ELEMENT);
       visitAll(node.__$ws_content, this, context);
       visitAllProperties(node.__$ws_attributes, this, context);
       visitAllProperties(node.__$ws_events, this, context);
       this.stack.pop();
    }
 
    visitDoctype(node: Ast.DoctypeNode, context: IContext): void { }
 
    visitCData(node: Ast.CDataNode, context: IContext): void { }
 
    visitInstruction(node: Ast.InstructionNode, context: IContext): void { }
 
    visitComment(node: Ast.CommentNode, context: IContext): void { }
 
    visitComponent(node: Ast.ComponentNode, context: IContext): void {
       const childContainer = this.processComponent(node, context);
       childContainer.desc = `<${node.__$ws_path.getFullPath()}>`;
       node.__$ws_internalTree = childContainer.getInternalStructure();
       node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }
 
    visitInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): void {
       const childContainer = this.processComponent(node, context);
       const template = context.scope.getTemplate(node.__$ws_name);
       const identifiers = collectInlineTemplateIdentifiers(node);
       childContainer.joinContainer(template.__$ws_container, identifiers);
       childContainer.desc = `<ws:partial> @@ inline "${node.__$ws_name}"`;
       node.__$ws_internalTree = childContainer.getInternalStructure();
       node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }
 
    visitStaticPartial(node: Ast.StaticPartialNode, context: IContext): void {
       const childContainer = this.processComponent(node, context);
       childContainer.desc = `<ws:partial> @@ static "${node.__$ws_path.getFullPath()}"`;
       node.__$ws_internalTree = childContainer.getInternalStructure();
       node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }
 
    visitDynamicPartial(node: Ast.DynamicPartialNode, context: IContext): void {
       const childContainer = this.processComponent(node, context);
       childContainer.registerProgram(node.__$ws_expression, ProgramType.OPTION, 'template');
       childContainer.desc = `<ws:partial> @@ dynamic "${node.__$ws_expression.string}"`;
       node.__$ws_internalTree = childContainer.getInternalStructure();
       node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }
 
    visitTemplate(node: Ast.TemplateNode, context: IContext): void {
       const container = context.container.createContainer(ContainerType.TEMPLATE);
       container.desc = `<ws:template> @@ "${node.__$ws_name}"`;
       const childContext: IContext = {
          childrenStorage: context.childrenStorage,
          scope: context.scope,
          container
       };
       this.stack.push(AbstractNodeType.DIRECTIVE);
       visitAll(node.__$ws_content, this, childContext);
       this.stack.pop();
       setRootNodeFlags(node.__$ws_content);
       node.__$ws_container = container;
       node.__$ws_internalTree = container.getInternalStructure();
       node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
    }
 
    visitIf(node: Ast.IfNode, context: IContext): void {
       const container = context.container.createContainer(ContainerType.CONDITIONAL);
       container.desc = `<ws:if> "${node.__$ws_test.string}"`;
       container.registerTestProgram(node.__$ws_test);
       const childContext: IContext = {
          childrenStorage: context.childrenStorage,
          scope: context.scope,
          container
       };
       this.stack.push(AbstractNodeType.DIRECTIVE);
       visitAll(node.__$ws_consequent, this, childContext);
       this.stack.pop();
       node.__$ws_container = container;
    }
 
    visitElse(node: Ast.ElseNode, context: IContext): void {
       const container = context.container.createContainer(ContainerType.CONDITIONAL);
       container.desc = '<ws:else>';
       container.isElse = true;
       if (node.__$ws_test !== null) {
          container.desc = `<ws:else> "${node.__$ws_test.string}"`;
          container.registerTestProgram(node.__$ws_test);
       }
       const childContext: IContext = {
          childrenStorage: context.childrenStorage,
          scope: context.scope,
          container
       };
       this.stack.push(AbstractNodeType.DIRECTIVE);
       visitAll(node.__$ws_consequent, this, childContext);
       this.stack.pop();
       node.__$ws_container = container;
    }
 
    visitFor(node: Ast.ForNode, context: IContext): void {
       const container = context.container.createContainer(ContainerType.CYCLE);
       container.desc = '<ws:for> aka for';
       const childContext: IContext = {
          childrenStorage: context.childrenStorage,
          scope: context.scope,
          container
       };
       if (node.__$ws_init) {
          container.registerProgram(node.__$ws_init, ProgramType.FLOAT, 'data');
       }
       container.registerProgram(node.__$ws_test, ProgramType.FLOAT, 'data');
       if (node.__$ws_update) {
          container.registerProgram(node.__$ws_update, ProgramType.FLOAT, 'data');
       }
       this.stack.push(AbstractNodeType.DIRECTIVE);
       visitAll(node.__$ws_content, this, childContext);
       this.stack.pop();
       node.__$ws_container = container;
    }
 
    visitForeach(node: Ast.ForeachNode, context: IContext): void {
       const container = context.container.createContainer(ContainerType.CYCLE);
       container.desc = '<ws:for> aka foreach';
       const childContext: IContext = {
          childrenStorage: context.childrenStorage,
          scope: context.scope,
          container
       };
       if (node.__$ws_index) {
          container.addIdentifier(node.__$ws_index.string);
       }
       container.addIdentifier(node.__$ws_iterator.string);
       container.registerProgram(node.__$ws_collection, ProgramType.SIMPLE, 'data');
       this.stack.push(AbstractNodeType.DIRECTIVE);
       visitAll(node.__$ws_content, this, childContext);
       this.stack.pop();
       node.__$ws_container = container;
    }
 
    visitArray(node: Ast.ArrayNode, context: IContext): void {
       this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
       visitAll(node.__$ws_elements, this, context);
       this.stack.pop();
    }
 
    visitBoolean(node: Ast.BooleanNode, context: IContext): void {
       this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
       visitAll(node.__$ws_data, this, context);
       this.stack.pop();
    }
 
    visitFunction(node: Ast.FunctionNode, context: IContext): void {
       this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
       visitAllProperties(node.__$ws_options, this, context);
       visitAll(node.__$ws_functionExpression, this, context);
       this.stack.pop();
    }
 
    visitNumber(node: Ast.NumberNode, context: IContext): void {
       this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
       visitAll(node.__$ws_data, this, context);
       this.stack.pop();
    }
 
    visitObject(node: Ast.ObjectNode, context: IContext): void {
       this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
       visitAllProperties(node.__$ws_properties, this, context);
       this.stack.pop();
    }
 
    visitString(node: Ast.StringNode, context: IContext): void {
       this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
       visitAll(node.__$ws_data, this, context);
       this.stack.pop();
    }
 
    visitValue(node: Ast.ValueNode, context: IContext): void {
       this.stack.push(AbstractNodeType.DATA_TYPE_DIRECTIVE);
       visitAll(node.__$ws_data, this, context);
       this.stack.pop();
    }
 
    visitText(node: Ast.TextNode, context: IContext): void {
       this.stack.push(AbstractNodeType.TEXT);
       visitAll(node.__$ws_content, this, context);
       this.stack.pop();
    }
 
    visitTextData(node: Ast.TextDataNode, context: IContext): void { }
 
    visitExpression(node: Ast.ExpressionNode, context: IContext): void {
       const programType = getProgramType(this.stack);
       const programName = programType === ProgramType.SIMPLE ? null : context.attributeName;
       context.container.registerProgram(node.__$ws_program, programType, programName);
    }
 
    visitTranslation(node: Ast.TranslationNode, context: IContext): void { }
 
    private processComponent(node: Ast.BaseWasabyElement, context: IContext): Container {
       const name = getComponentName(node);
       if (name !== null) {
          context.childrenStorage.push(name);
       }
       const container = context.container.createContainer(ContainerType.COMPONENT);
       const childContext: IContext = {
          childrenStorage: context.childrenStorage,
          scope: context.scope,
          container
       };
       this.stack.push(AbstractNodeType.COMPONENT);
       visitAllProperties(node.__$ws_attributes, this, childContext);
       visitAllProperties(node.__$ws_events, this, childContext);
       visitAllProperties(node.__$ws_options, this, childContext);
       visitAllProperties(node.__$ws_contents, this, childContext);
       this.stack.pop();
       node.__$ws_container = container;
       return container;
    }
 }

//#endregion
