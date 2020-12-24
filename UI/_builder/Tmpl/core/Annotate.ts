/// <amd-module name="UI/_builder/Tmpl/core/Annotate" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Annotate.ts
 */

import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import Scope from 'UI/_builder/Tmpl/core/Scope';
import { createGlobalContext, IContext as ILexicalContext, IProgramMeta } from 'UI/_builder/Tmpl/core/Context';

// <editor-fold desc="Public interfaces and functions">

export interface IAnnotatedTree extends Array<Ast.Ast> {
   childrenStorage: string[];
   reactiveProps: string[];
   templateNames: string[];
   lexicalContext: ILexicalContext;
   __newVersion: boolean;
}

export interface IAnnotateProcessor {
   annotate(nodes: Ast.Ast[], scope: Scope): IAnnotatedTree;
}

export default function annotate(nodes: Ast.Ast[], scope: Scope): IAnnotatedTree {
   return new AnnotateProcessor()
      .annotate(nodes, scope);
}

// </editor-fold>

// <editor-fold desc="Private interfaces and constants">

interface IContext {
   childrenStorage: string[];
   lexicalContext: ILexicalContext;
   scope: Scope;
}

// </editor-fold>

// <editor-fold desc="Private annotation functions">

function appendInternalExpressions(internal: Ast.IInternal, programs: IProgramMeta[]): void {
   for (let index = 0; index < programs.length; ++index) {
      const program = programs[index];
      internal[program.key] = {
         data: [
            new Ast.ExpressionNode(program.node)
         ],
         type: 'text'
      };
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

function getElementName(element: Ast.BaseHtmlElement): string | null {
   if (element.__$ws_attributes.hasOwnProperty('attr:name')) {
      return getStringValueFromText(element.__$ws_attributes['attr:name'].__$ws_value);
   }
   if (element.__$ws_attributes.hasOwnProperty('name')) {
      return getStringValueFromText(element.__$ws_attributes['name'].__$ws_value);
   }
   return null;
}

function getStringValueFromData(value: Ast.TData): string | null {
   if (value instanceof Ast.ValueNode) {
      return getStringValueFromText(value.__$ws_data);
   }
   if (value instanceof Ast.StringNode) {
      return getStringValueFromText(value.__$ws_data);
   }
   return null;
}

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

// </editor-fold>

class AnnotateProcessor implements Ast.IAstVisitor, IAnnotateProcessor {

   annotate(nodes: Ast.Ast[], scope: Scope): IAnnotatedTree {
      const childrenStorage: string[] = [ ];
      const global = createGlobalContext();
      nodes.forEach((node: Ast.Ast) => {
         const lexicalContext = global.createContext();
         const context: IContext = {
            childrenStorage,
            lexicalContext,
            scope
         };
         node.accept(this, context);
         if (node instanceof Ast.TemplateNode) {
            // Do not overwrite template node lexical context and internal
            // because that node has its own programs
            return;
         }
         if (!(node instanceof Ast.ForNode || node instanceof Ast.ForeachNode)) {
            // Do not overwrite cycle node lexical context and internal
            // because that node has its own programs
            node.__$ws_lexicalContext = lexicalContext;
         }
         node.__$ws_internal = {};
         appendInternalExpressions(node.__$ws_internal, lexicalContext.getInternalPrograms());
      });
      const reactiveProperties: string[] = global.getIdentifiers(true);
      const result = <IAnnotatedTree>nodes;
      result.lexicalContext = global;
      result.childrenStorage = childrenStorage;
      result.reactiveProps = reactiveProperties;
      result.templateNames = scope.getTemplateNames();
      result.__newVersion = true;
      return result;
   }

   // <editor-fold desc="Data types">

   visitArray(node: Ast.ArrayNode, context: IContext): void {
      this.processNodes(node.__$ws_elements, context);
   }

   visitBoolean(node: Ast.BooleanNode, context: IContext): void {
      this.processNodes(node.__$ws_data, context);
   }

   visitFunction(node: Ast.FunctionNode, context: IContext): void {
      this.processCollection(node.__$ws_options, context);
      this.processNodes(node.__$ws_functionExpression, context);
   }

   visitNumber(node: Ast.NumberNode, context: IContext): void {
      this.processNodes(node.__$ws_data, context);
   }

   visitObject(node: Ast.ObjectNode, context: IContext): void {
      this.processCollection(node.__$ws_properties, context);
   }

   visitString(node: Ast.StringNode, context: IContext): void {
      this.processNodes(node.__$ws_data, context);
   }

   visitValue(node: Ast.ValueNode, context: IContext): void {
      this.processNodes(node.__$ws_data, context);
   }

   // </editor-fold>

   // <editor-fold desc="Attributes and options">

   visitAttribute(node: Ast.AttributeNode, context: IContext): void {
      this.processNodes(node.__$ws_value, context);
   }

   visitBind(node: Ast.BindNode, context: IContext): void {
      node.__$ws_value.__$ws_id = context.lexicalContext.registerBindProgram(node.__$ws_value);
   }

   visitEvent(node: Ast.EventNode, context: IContext): void {
      context.lexicalContext.registerEventProgram(node.__$ws_handler);
   }

   visitOption(node: Ast.OptionNode, context: IContext): void {
      node.__$ws_value.accept(this, context);
   }

   // </editor-fold>

   // <editor-fold desc="HTML nodes">

   visitCData(node: Ast.CDataNode, context: IContext): void { }

   visitComment(node: Ast.CommentNode, context: IContext): void { }

   visitContentOption(node: Ast.ContentOptionNode, context: IContext): void {
      const lexicalContext = context.lexicalContext.createContext({
         identifiers: [node.__$ws_name]
      });
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      this.processNodes(node.__$ws_content, contentContext);
      setRootNodeFlags(node.__$ws_content);
      node.__$ws_lexicalContext = lexicalContext;
      node.__$ws_internal = { };
      appendInternalExpressions(node.__$ws_internal, lexicalContext.getInternalPrograms());
   }

   visitDoctype(node: Ast.DoctypeNode, context: IContext): void { }

   visitElement(node: Ast.ElementNode, context: IContext): void {
      const name = getElementName(node);
      if (name !== null) {
         context.childrenStorage.push(name);
      }
      this.processNodes(node.__$ws_content, context);
      for (const name in node.__$ws_attributes) {
         const attribute = node.__$ws_attributes[name];
         attribute.accept(this, context);
      }
      for (const name in node.__$ws_events) {
         const event = node.__$ws_events[name];
         event.accept(this, context);
      }
   }

   visitInstruction(node: Ast.InstructionNode, context: IContext): void { }

   // </editor-fold>

   // <editor-fold desc="Directives">

   visitElse(node: Ast.ElseNode, context: IContext): void {
      this.processNodes(node.__$ws_consequent, context);
      if (node.__$ws_test) {
         node.__$ws_test.__$ws_id = context.lexicalContext.registerProgram(node.__$ws_test);
      }
      if (node.__$ws_alternate) {
         node.__$ws_alternate.accept(this, context);
      }
   }

   visitFor(node: Ast.ForNode, context: IContext): void {
      const lexicalContext = context.lexicalContext.createContext();
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      if (node.__$ws_init) {
         lexicalContext.registerFloatProgram(node.__$ws_init);
      }
      lexicalContext.registerFloatProgram(node.__$ws_test);
      if (node.__$ws_update) {
         lexicalContext.registerFloatProgram(node.__$ws_update);
      }
      this.processNodes(node.__$ws_content, contentContext);
      node.__$ws_lexicalContext = lexicalContext;
   }

   visitForeach(node: Ast.ForeachNode, context: IContext): void {
      const identifiers = [];
      if (node.__$ws_index) {
         identifiers.push(node.__$ws_index.string);
      }
      identifiers.push(node.__$ws_iterator.string);
      const lexicalContext = context.lexicalContext.createContext({
         identifiers
      });
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      node.__$ws_collection.__$ws_id = lexicalContext.registerProgram(node.__$ws_collection);
      this.processNodes(node.__$ws_content, contentContext);
      node.__$ws_lexicalContext = lexicalContext;
   }

   visitIf(node: Ast.IfNode, context: IContext): void {
      this.processNodes(node.__$ws_consequent, context);
      node.__$ws_test.__$ws_id = context.lexicalContext.registerProgram(node.__$ws_test);
      if (node.__$ws_alternate) {
         node.__$ws_alternate.accept(this, context);
      }
   }

   visitTemplate(node: Ast.TemplateNode, context: IContext): void {
      const lexicalContext = context.lexicalContext.createContext({
         allowHoisting: false
      });
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      this.processNodes(node.__$ws_content, contentContext);
      setRootNodeFlags(node.__$ws_content);
      node.__$ws_lexicalContext = lexicalContext;
      node.__$ws_internal = { };
      appendInternalExpressions(node.__$ws_internal, lexicalContext.getInternalPrograms());
   }

   // </editor-fold>

   // <editor-fold desc="Extended text">

   visitExpression(node: Ast.ExpressionNode, context: IContext): void {
      node.__$ws_program.__$ws_id = context.lexicalContext.registerProgram(node.__$ws_program);
   }

   visitText(node: Ast.TextNode, context: IContext): void {
      this.processNodes(node.__$ws_content, context);
   }

   visitTextData(node: Ast.TextDataNode, context: IContext): void { }

   visitTranslation(node: Ast.TranslationNode, context: IContext): void { }

   // </editor-fold>

   // <editor-fold desc="Components and templates">

   visitComponent(node: Ast.ComponentNode, context: IContext): void {
      const lexicalContext = context.lexicalContext.createContext();
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      this.processComponentContent(node, contentContext);
   }

   visitDynamicPartial(node: Ast.DynamicPartialNode, context: IContext): void {
      const lexicalContext = context.lexicalContext.createContext();
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      this.processComponentContent(node, contentContext);
      node.__$ws_expression.__$ws_id = lexicalContext.registerProgram(node.__$ws_expression);
   }

   visitInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): void {
      const template = context.scope.getTemplate(node.__$ws_name);
      const identifiers = collectInlineTemplateIdentifiers(node);
      const lexicalContext = context.lexicalContext.createContext();
      lexicalContext.joinContext(template.__$ws_lexicalContext, { identifiers });
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      this.processComponentContent(node, contentContext);
   }

   visitStaticPartial(node: Ast.StaticPartialNode, context: IContext): void {
      const lexicalContext = context.lexicalContext.createContext();
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      this.processComponentContent(node, contentContext);
   }

   // </editor-fold>

   private processCollection(collection: Ast.IOptions | Ast.IObjectProperties, context: IContext): void {
      for (const name in collection) {
         const property = collection[name];
         property.accept(this, context);
      }
   }

   private processNodes(nodes: Ast.Ast[], context: IContext): void {
      nodes.forEach((node: Ast.Ast) => {
         node.accept(this, context);
      });
   }

   private processComponentContent(node: Ast.BaseWasabyElement, context: IContext): void {
      const name = getComponentName(node);
      if (name !== null) {
         context.childrenStorage.push(name);
      }
      const afterInternalNodes: Ast.Ast[] = [];
      for (const name in node.__$ws_options) {
         const option = node.__$ws_options[name];
         if (option.hasFlag(Ast.Flags.UNPACKED)) {
            afterInternalNodes.push(option);
            continue;
         }
         option.accept(this, context);
      }
      for (const name in node.__$ws_contents) {
         const content = node.__$ws_contents[name];
         content.accept(this, context);
      }
      for (const name in node.__$ws_attributes) {
         const attribute = node.__$ws_attributes[name];
         afterInternalNodes.push(attribute);
      }
      for (const name in node.__$ws_events) {
         const event = node.__$ws_events[name];
         if (event instanceof Ast.BindNode) {
            event.accept(this, context);
            continue;
         }
         afterInternalNodes.push(event);
      }
      node.__$ws_lexicalContext = context.lexicalContext;
      node.__$ws_internal = { };
      appendInternalExpressions(node.__$ws_internal, context.lexicalContext.getInternalPrograms());
      afterInternalNodes.forEach((node: Ast.Ast): void => {
         node.accept(this, context);
      });
   }
}
