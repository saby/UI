import * as Ast from './Ast';
import Scope from 'UI/_builder/Tmpl/core/Scope';
import { IdentifierNode, MemberExpressionNode, ProgramNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { IParser, Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';

interface IContext {
   attributeName?: string;
   isProcessingAttribute?: boolean;
   isProcessingOption?: boolean;
   container: Container;
   scope: Scope;
}

enum ProgramType {
   SIMPLE,
   ATTRIBUTE,
   BIND,
   OPTION,
   EVENT,
   FLOAT
}

export interface IProgramMeta {
   name: string | null;
   typeName: string;
   type: ProgramType;
   node: ProgramNode;
   index: number;
   isSynthetic: boolean;
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

const PARSER = new Parser();

const FILE_NAME = '[[internal]]';

const FORBIDDEN_IDENTIFIERS = [
   '...',
   '_options',
   '_container',
   '_children',
   'rk'
];

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

function patchProgramNode(meta: IProgramMeta): void {
   // @ts-ignore FIXME: Set unique index for program node
   meta.node.__$ws_index = meta.index;
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

export enum InternalNodeType {
   IF,
   ELSE_IF,
   ELSE,
   BLOCK
}

export class InternalNode {
   public readonly index: number;

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

   removeIfContains(identifiers: string[], allocator: IndexAllocator): void {
      this.checkCleanConditional(identifiers, allocator);
      this.cleanStorage(identifiers, allocator);
      for (let index = 0; index < this.children.length; ++index) {
         this.children[index].removeIfContains(identifiers, allocator);
      }
   }

   setType(type: InternalNodeType): void {
      this.type = type;
      this.typeName = InternalNodeType[type];
   }

   private cleanStorage(identifiers: string[], allocator: IndexAllocator): void {
      const collection = this.storage.getMeta();
      for (let index = 0; index < collection.length; ++index) {
         const meta = collection[index];
         if (containsIdentifiers(meta.node, identifiers, FILE_NAME)) {
            this.storage.remove(meta);

            const identifiers = collectIdentifiers(meta.node, FILE_NAME);
            for (let idIndex = 0; idIndex < identifiers.length; ++idIndex) {
               const identifier = identifiers[idIndex];
               if (identifiers.indexOf(identifier) > -1) {
                  continue;
               }
               const program = PARSER.parse(identifier);
               const idMeta = createProgramMeta(
                  null,
                  ProgramType.SIMPLE,
                  program,
                  allocator.allocate(),
                  true
               );
               this.storage.set(idMeta);
            }
         }
      }
   }

   private checkCleanConditional(identifiers: string[], allocator: IndexAllocator): void {
      if (this.type === InternalNodeType.BLOCK || this.type === InternalNodeType.ELSE) {
         return;
      }
      if (containsIdentifiers(this.test.node, identifiers, FILE_NAME)) {
         this.dropAndAppend(identifiers, allocator);
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
            true
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

class IndexAllocator {
   private index: number;

   constructor(index: number) {
      this.index = index;
   }

   allocate(): number {
      return this.index++;
   }
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
      const meta = createProgramMeta(
         'data',
         ProgramType.SIMPLE,
         program,
         this.allocateProgramIndex(),
         false
      );
      this.test = meta;
      patchProgramNode(meta);
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
         join.identifiers.push(identifiers[index]);
      }
      join.children.push(container);
      this.children.push(join);
   }

   getInternalStructure(removeSelfIdentifiers: boolean = false): InternalNode {
      const allocator = new IndexAllocator(this.getCurrentProgramIndex());
      const indices = new Set<number>();
      return this.collectInternalStructure(0, allocator, indices, removeSelfIdentifiers);
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

   private collectInternalStructure(depth: number, allocator: IndexAllocator, indices: Set<number>, removeSelfIdentifiers: boolean): InternalNode {
      const node = this.createInternalNode(indices, depth === 0);
      let prevChild: InternalNode | null = null;
      for (let index = 0; index < this.children.length; ++index) {
         const child = this.children[index].collectInternalStructure(depth + 1, allocator, indices, removeSelfIdentifiers);
         node.children.push(child);
         child.prev = prevChild;
         if (prevChild !== null) {
            prevChild.next = child;
         }
         prevChild = child;
         child.setParent(node);
      }
      if (!removeSelfIdentifiers && depth === 0 && this.type === ContainerType.CONTENT_OPTION) {
         return node;
      }
      if (this.selfIdentifiers.length > 0) {
         node.removeIfContains(this.selfIdentifiers, allocator);
      }
      return node;
   }

   private createInternalNode(indices: Set<number>, removeSelfOptions: boolean): InternalNode {
      const node = new InternalNode(this.index, this.getInternalNodeType(), this);
      node.test = this.test;
      let selfPrograms = this.storage.getMeta();
      if (removeSelfOptions) {
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
               return meta.isSynthetic;
            }
            return true;
         });
      }
      for (let index = 0; index < selfPrograms.length; ++index) {
         if (indices.has(selfPrograms[index].index)) {
            continue;
         }
         node.storage.set(selfPrograms[index]);
         indices.add(selfPrograms[index].index);
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
         isSynthetic
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
      this.commitIdentifiersAsPrograms(identifiers, this.identifiers);
      for (let index = 0; index < identifiers.length; ++index) {
         const identifier = identifiers[index];
         this.hoistIdentifier(identifier);
         this.commitIdentifier(identifier);
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

   private hoistReactiveIdentifier(identifier: string): void {
      if (this.parent === null) {
         this.commitIdentifier(identifier);
         return;
      }
      this.parent.hoistReactiveIdentifier(identifier);
   }

   private commitProgram(meta: IProgramMeta): void {
      this.storage.set(meta);
      patchProgramNode(meta);
   }

   private commitIdentifiersAsPrograms(identifiers: string[], localIdentifiers: string[]): void {
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
            ProgramType.SIMPLE,
            program,
            this.allocateProgramIndex(),
            true
         );
         this.commitProgram(meta);
      }
   }
}

function createProgramMeta(name: string | null, type: ProgramType, node: ProgramNode, index: number, isSynthetic: boolean): IProgramMeta {
   return {
      typeName: ProgramType[type],
      index,
      name,
      node,
      isSynthetic,
      type
   };
}

function visitAll(nodes: Ast.Ast[], visitor: Ast.IAstVisitor, context: IContext): void {
   for (let index = 0; index < nodes.length; ++index) {
      nodes[index].accept(visitor, context);
   }
}

declare type IProperties = Ast.IAttributes | Ast.IEvents | Ast.IOptions | Ast.IContents | Ast.IObjectProperties;

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

const INTERNAL_PROGRAM_PREFIX = '__dirtyCheckingVars_';

function wrapInternalExpressions(programs: IProgramMeta[]): any {
   const internal = { };
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

class InternalVisitor implements Ast.IAstVisitor {

   process(nodes: Ast.Ast[], scope: Scope): Container {
      const container = new Container(null, ContainerType.GLOBAL);
      const context: IContext = {
         container,
         scope
      };
      visitAll(nodes, this, context);
      // @ts-ignore FIXME: Save container onto node of abstract syntax tree
      nodes.$$container = container;
      return container;
   }

   visitAttribute(node: Ast.AttributeNode, context: IContext): void {
      const childContext: IContext = {
         ...context,
         attributeName: node.__$ws_name,
         isProcessingAttribute: true
      };
      visitAll(node.__$ws_value, this, childContext);
   }

   visitOption(node: Ast.OptionNode, context: IContext): void {
      const childContext: IContext = {
         ...context,
         attributeName: node.__$ws_name,
         isProcessingOption: true
      };
      node.__$ws_value.accept(this, childContext);
   }

   visitContentOption(node: Ast.ContentOptionNode, context: IContext): void {
      const container = context.container.createContainer(ContainerType.CONTENT_OPTION);
      container.addIdentifier(node.__$ws_name);
      container.desc = node.__$ws_name;
      const childContext: IContext = {
         ...context,
         container
      };
      // @ts-ignore FIXME: Save container onto node of abstract syntax tree
      node.$$container = container;
      visitAll(node.__$ws_content, this, childContext);
      node.__$ws_internalTree = container.getInternalStructure();
      node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
   }

   visitBind(node: Ast.BindNode, context: IContext): void {
      context.container.registerProgram(node.__$ws_value, ProgramType.BIND, node.__$ws_property);
   }

   visitEvent(node: Ast.EventNode, context: IContext): void {
      context.container.registerProgram(node.__$ws_handler, ProgramType.EVENT, node.__$ws_event);
   }

   visitElement(node: Ast.ElementNode, context: IContext): void {
      visitAll(node.__$ws_content, this, context);
      visitAllProperties(node.__$ws_attributes, this, context);
      visitAllProperties(node.__$ws_events, this, context);
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
      // @ts-ignore FIXME: Get container from node of abstract syntax tree
      childContainer.joinContainer(template.$$container, identifiers);
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
         ...context,
         container
      };
      visitAll(node.__$ws_content, this, childContext);
      // @ts-ignore FIXME: Save container onto node of abstract syntax tree
      node.$$container = container;
      node.__$ws_internalTree = container.getInternalStructure();
      node.__$ws_internal = wrapInternalExpressions(node.__$ws_internalTree.flatten());
   }

   visitIf(node: Ast.IfNode, context: IContext): void {
      const container = context.container.createContainer(ContainerType.CONDITIONAL);
      container.desc = `<ws:if> "${node.__$ws_test.string}"`;
      container.registerTestProgram(node.__$ws_test);
      const childContext: IContext = {
         ...context,
         container
      };
      visitAll(node.__$ws_consequent, this, childContext);
      // @ts-ignore FIXME: Save container onto node of abstract syntax tree
      node.$$container = container;
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
         ...context,
         container
      };
      visitAll(node.__$ws_consequent, this, childContext);
      // @ts-ignore FIXME: Save container onto node of abstract syntax tree
      node.$$container = container;
   }

   visitFor(node: Ast.ForNode, context: IContext): void {
      const container = context.container.createContainer(ContainerType.CYCLE);
      container.desc = '<ws:for> aka for';
      const childContext: IContext = {
         ...context,
         container
      };
      if (node.__$ws_init) {
         container.registerProgram(node.__$ws_init, ProgramType.FLOAT, 'data');
      }
      container.registerProgram(node.__$ws_test, ProgramType.FLOAT, 'data');
      if (node.__$ws_update) {
         container.registerProgram(node.__$ws_update, ProgramType.FLOAT, 'data');
      }
      visitAll(node.__$ws_content, this, childContext);
      // @ts-ignore FIXME: Save container onto node of abstract syntax tree
      node.$$container = container;
   }

   visitForeach(node: Ast.ForeachNode, context: IContext): void {
      const container = context.container.createContainer(ContainerType.CYCLE);
      container.desc = '<ws:for> aka foreach';
      const childContext: IContext = {
         ...context,
         container
      };
      if (node.__$ws_index) {
         container.addIdentifier(node.__$ws_index.string);
      }
      container.addIdentifier(node.__$ws_iterator.string);
      container.registerProgram(node.__$ws_collection, ProgramType.SIMPLE, 'data');
      visitAll(node.__$ws_content, this, childContext);
      // @ts-ignore FIXME: Save container onto node of abstract syntax tree
      node.$$container = container;
   }

   visitArray(node: Ast.ArrayNode, context: IContext): void {
      visitAll(node.__$ws_elements, this, context);
   }

   visitBoolean(node: Ast.BooleanNode, context: IContext): void {
      visitAll(node.__$ws_data, this, context);
   }

   visitFunction(node: Ast.FunctionNode, context: IContext): void {
      visitAllProperties(node.__$ws_options, this, context);
      visitAll(node.__$ws_functionExpression, this, context);
   }

   visitNumber(node: Ast.NumberNode, context: IContext): void {
      visitAll(node.__$ws_data, this, context);
   }

   visitObject(node: Ast.ObjectNode, context: IContext): void {
      visitAllProperties(node.__$ws_properties, this, context);
   }

   visitString(node: Ast.StringNode, context: IContext): void {
      visitAll(node.__$ws_data, this, context);
   }

   visitValue(node: Ast.ValueNode, context: IContext): void {
      visitAll(node.__$ws_data, this, context);
   }

   visitText(node: Ast.TextNode, context: IContext): void {
      visitAll(node.__$ws_content, this, context);
   }

   visitTextData(node: Ast.TextDataNode, context: IContext): void { }

   visitExpression(node: Ast.ExpressionNode, context: IContext): void {
      if (context.isProcessingAttribute) {
         context.container.registerProgram(node.__$ws_program, ProgramType.ATTRIBUTE, context.attributeName);
         return;
      }
      if (context.isProcessingOption) {
         context.container.registerProgram(node.__$ws_program, ProgramType.OPTION, context.attributeName);
         return;
      }
      context.container.registerProgram(node.__$ws_program, ProgramType.SIMPLE, null);
   }

   visitTranslation(node: Ast.TranslationNode, context: IContext): void { }

   private processComponent(node: Ast.BaseWasabyElement, context: IContext): Container {
      const container = context.container.createContainer(ContainerType.COMPONENT);
      const childContext: IContext = {
         ...context,
         container
      };
      visitAllProperties(node.__$ws_options, this, childContext);
      visitAllProperties(node.__$ws_contents, this, childContext);
      visitAllProperties(node.__$ws_attributes, this, childContext);
      visitAllProperties(node.__$ws_events, this, childContext);
      // @ts-ignore FIXME: Save container onto node of abstract syntax tree
      node.$$container = container;
      return container;
   }
}

export function process(nodes: Ast.Ast[], scope: Scope): void {
   new InternalVisitor().process(nodes, scope);
}
