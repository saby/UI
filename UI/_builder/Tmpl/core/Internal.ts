import * as Ast from './Ast';
import { IdentifierNode, ProgramNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';

interface IContext {
   attributeName?: string;
   isProcessingAttribute?: boolean;
   isProcessingOption?: boolean;
   container: Container;
}

enum ProgramType {
   SIMPLE,
   ATTRIBUTE,
   BIND,
   OPTION,
   EVENT,
   FLOAT
}

interface IProgramMeta {
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
   CYCLE
}

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

   getMeta(): IProgramMeta[] {
      return Array(...this.programs);
   }
}

class Container {
   public readonly typeName: string;
   public meta: string;

   public readonly globalContainers: Array<Container>;
   public programIndex: number;

   public index: number;
   public readonly type: ContainerType;
   public readonly parent: Container | null;
   public condition: ProgramNode | null;
   public readonly identifiers: Array<string>;
   public readonly storage: ProgramStorage;
   public readonly children: Array<Container>;

   constructor(parent: Container | null, type: ContainerType) {
      this.typeName = ContainerType[type];
      this.meta = '';

      this.globalContainers = parent === null ? new Array<Container>() : parent.globalContainers;
      this.programIndex = 0;
      this.type = type;
      this.parent = parent;
      this.condition = null;
      this.identifiers = new Array<string>();
      this.storage = new ProgramStorage();
      this.children = new Array<Container>();

      this.index = this.globalContainers.length;
      this.globalContainers.push(this);

      if (this.parent !== null) {
         this.parent.children.push(this);
      }
   }

   createContainer(type: ContainerType): Container {
      return new Container(this, type);
   }

   registerProgram(program: ProgramNode, type: ProgramType, name: string | null): void {
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
         false
      );
      this.commitProgram(meta);
   }

   getOwnIdentifiers(): string[] {
      return Array(...this.identifiers);
   }

   private allocateProgramIndex(): number {
      if (this.parent === null) {
         return this.programIndex++;
      }
      return this.parent.allocateProgramIndex();
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
      if (this.parent !== null && this.type !== ContainerType.TEMPLATE) {
         this.parent.hoistIdentifier(identifier);
         return;
      }
      this.commitIdentifier(identifier);
      this.hoistReactiveIdentifier(identifier);
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
   }
}

function createProgramMeta(name: string | null, type: ProgramType, node: ProgramNode, index: number, isSynthetic: boolean): IProgramMeta {
   return {
      name,
      typeName: ProgramType[type],
      type,
      node,
      index,
      isSynthetic
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

class InternalVisitor implements Ast.IAstVisitor {

   process(nodes: Ast.Ast[]): Container {
      const container = new Container(null, ContainerType.GLOBAL);
      const context: IContext = {
         container
      };
      visitAll(nodes, this, context);
      // @ts-ignore
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
      container.identifiers.push(node.__$ws_name);
      container.meta = node.__$ws_name;
      const childContext: IContext = {
         container
      };
      // @ts-ignore
      node.$$container = container;
      visitAll(node.__$ws_content, this, childContext);
   }

   visitBind(node: Ast.BindNode, context: IContext): void {
      context.container.registerProgram(node.__$ws_value, ProgramType.BIND, node.__$ws_property);
   }

   visitEvent(node: Ast.EventNode, context: IContext): void {
      context.container.registerProgram(node.__$ws_handler, ProgramType.EVENT, node.__$ws_event);
   }

   visitElement(node: Ast.ElementNode, context: IContext): void {
      visitAllProperties(node.__$ws_attributes, this, context);
      visitAllProperties(node.__$ws_events, this, context);
      visitAll(node.__$ws_content, this, context);
   }

   visitDoctype(node: Ast.DoctypeNode, context: IContext): void { }

   visitCData(node: Ast.CDataNode, context: IContext): void { }

   visitInstruction(node: Ast.InstructionNode, context: IContext): void { }

   visitComment(node: Ast.CommentNode, context: IContext): void { }

   visitComponent(node: Ast.ComponentNode, context: IContext): void {
      const childContainer = this.processComponent(node, context);
      childContainer.meta = `<Component> @@ ${node.__$ws_path.getFullPath()}`;
   }

   visitInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): void {
      const childContainer = this.processComponent(node, context);
      childContainer.meta = `<ws:partial> @@ inline "${node.__$ws_name}"`;
   }

   visitStaticPartial(node: Ast.StaticPartialNode, context: IContext): void {
      const childContainer = this.processComponent(node, context);
      childContainer.meta = `<ws:partial> directive @@ static "${node.__$ws_path.getFullPath()}"`;
   }

   visitDynamicPartial(node: Ast.DynamicPartialNode, context: IContext): void {
      const childContainer = this.processComponent(node, context);
      childContainer.registerProgram(node.__$ws_expression, ProgramType.SIMPLE, 'template');
      childContainer.meta = `<ws:partial> directive @@ dynamic "${node.__$ws_expression.string}"`;
   }

   visitTemplate(node: Ast.TemplateNode, context: IContext): void {
      const container = context.container.createContainer(ContainerType.TEMPLATE);
      container.meta = `<ws:template> directive @@ ${node.__$ws_name}`;
      const childContext: IContext = {
         container
      };
      visitAll(node.__$ws_content, this, childContext);
      // @ts-ignore
      node.$$container = container;
   }

   visitIf(node: Ast.IfNode, context: IContext): void {
      const container = context.container.createContainer(ContainerType.CONDITIONAL);
      container.meta = `<ws:if> "${node.__$ws_test.string}"`;
      container.condition = node.__$ws_test;
      container.registerProgram(node.__$ws_test, ProgramType.SIMPLE, 'data');
      const childContext: IContext = {
         container
      };
      visitAll(node.__$ws_consequent, this, childContext);
      // @ts-ignore
      node.$$container = container;
   }

   visitElse(node: Ast.ElseNode, context: IContext): void {
      const container = context.container.createContainer(ContainerType.CONDITIONAL);
      container.meta = '<ws:else>';
      if (node.__$ws_test !== null) {
         container.meta = `<ws:else> "${node.__$ws_test.string}"`;
         container.condition = node.__$ws_test;
         container.registerProgram(node.__$ws_test, ProgramType.SIMPLE, 'data');
      }
      const childContext: IContext = {
         container
      };
      visitAll(node.__$ws_consequent, this, childContext);
      // @ts-ignore
      node.$$container = container;
   }

   visitFor(node: Ast.ForNode, context: IContext): void {
      const container = context.container.createContainer(ContainerType.CYCLE);
      container.meta = '<ws:for> aka for';
      const childContext: IContext = {
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
      // @ts-ignore
      node.$$container = container;
   }

   visitForeach(node: Ast.ForeachNode, context: IContext): void {
      const container = context.container.createContainer(ContainerType.CYCLE);
      container.meta = '<ws:for> aka foreach';
      const childContext: IContext = {
         container
      };
      if (node.__$ws_index) {
         container.identifiers.push(node.__$ws_index.string);
      }
      container.identifiers.push(node.__$ws_iterator.string);
      container.registerProgram(node.__$ws_collection, ProgramType.SIMPLE, 'data');
      visitAll(node.__$ws_content, this, childContext);
      // @ts-ignore
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
         container
      };
      visitAllProperties(node.__$ws_options, this, childContext);
      visitAllProperties(node.__$ws_contents, this, childContext);
      visitAllProperties(node.__$ws_attributes, this, childContext);
      visitAllProperties(node.__$ws_events, this, childContext);
      // @ts-ignore
      node.$$container = container;
      return container;
   }
}

export function process(nodes: Ast.Ast[]): void {
   new InternalVisitor().process(nodes);
}