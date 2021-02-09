/// <amd-module name="UI/_builder/Tmpl/core/Annotate" />

/**
 * @description Represents interfaces, methods and classes to annotate AST.
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Annotate.ts
 */

import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import Scope from 'UI/_builder/Tmpl/core/Scope';
import {
   ContextType,
   createGlobalContext,
   IContext as ILexicalContext,
   IProgramMeta,
   SpecialProgramType
} from 'UI/_builder/Tmpl/core/Context';

// <editor-fold desc="Public interfaces and functions">

/**
 * Interface for annotated abstract syntax tree.
 */
export interface IAnnotatedTree extends Array<Ast.Ast> {

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
   lexicalContext: ILexicalContext;

   /**
    * Special flag.
    * @deprecated
    */
   __newVersion: boolean;
}

/**
 * Annotate processor interface.
 */
export interface IAnnotateProcessor {

   /**
    * Annotate abstract syntax tree.
    * @param nodes {Ast[]} Collection of nodes of abstract syntax tree.
    * @param scope {Scope} Processing scope object.
    */
   annotate(nodes: Ast.Ast[], scope: Scope): IAnnotatedTree;
}

/**
 * Annotate abstract syntax tree.
 * @param nodes {Ast[]} Collection of nodes of abstract syntax tree.
 * @param scope {Scope} Processing scope object.
 */
export default function annotate(nodes: Ast.Ast[], scope: Scope): IAnnotatedTree {
   return new AnnotateProcessor()
      .annotate(nodes, scope);
}

// </editor-fold>

// <editor-fold desc="Private interfaces and constants">

/**
 * Annotating context.
 */
interface IContext {

   /**
    * Child names collection.
    */
   childrenStorage: string[];

   /**
    * Lexical context.
    */
   lexicalContext: ILexicalContext;

   /**
    * Processing scope object.
    */
   scope: Scope;
}

// </editor-fold>

// <editor-fold desc="Private annotation functions">

/**
 * Append internal expressions.
 * @param internal {IInternal} Internal collection.
 * @param programs {IProgramMeta[]} Collection of program meta information.
 */
function appendInternalExpressions(internal: Ast.IInternal, programs: IProgramMeta[]): void {

   // FIXME: DEVELOP: REMOVE
   programs.sort(function(a, b) {
      if (a.node.string < b.node.string) return -1;
      if (a.node.string > b.node.string) return +1;
      return 0;
   });

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

/**
 * Collect identifiers for inline template node.
 * @param node {InlineTemplateNode} Inline template node.
 * @return {string[]} Identifier names collection.
 */
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

// </editor-fold>

/**
 * Annotate processor.
 */
class AnnotateProcessor implements Ast.IAstVisitor, IAnnotateProcessor {

   /**
    * Annotate abstract syntax tree.
    * @param nodes {Ast[]} Collection of nodes of abstract syntax tree.
    * @param scope {Scope} Processing scope object.
    */
   annotate(nodes: Ast.Ast[], scope: Scope): IAnnotatedTree {
      const childrenStorage: string[] = [];
      const global = createGlobalContext();
      nodes.forEach((node: Ast.Ast) => {
         const lexicalContext = global.createContext({
            type: ContextType.INTERMEDIATE
         });
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
      const reactiveProperties: string[] = global.getOwnIdentifiers();
      const result = <IAnnotatedTree>nodes;
      result.lexicalContext = global;
      result.childrenStorage = childrenStorage;
      result.reactiveProps = reactiveProperties;
      result.templateNames = scope.getTemplateNames();
      result.__newVersion = true;
      return result;
   }

   // <editor-fold desc="Data types">

   /**
    * Visit array data node.
    * @param node {ArrayNode} Concrete array data node.
    * @param context {IContext} Annotating context.
    */
   visitArray(node: Ast.ArrayNode, context: IContext): void {
      this.processNodes(node.__$ws_elements, context);
   }

   /**
    * Visit boolean data node.
    * @param node {BooleanNode} Concrete boolean data node.
    * @param context {IContext} Annotating context.
    */
   visitBoolean(node: Ast.BooleanNode, context: IContext): void {
      this.processNodes(node.__$ws_data, context);
   }

   /**
    * Visit function data node.
    * @param node {FunctionNode} Concrete function data node.
    * @param context {IContext} Annotating context.
    */
   visitFunction(node: Ast.FunctionNode, context: IContext): void {
      this.processCollection(node.__$ws_options, context);
      this.processNodes(node.__$ws_functionExpression, context);
   }

   /**
    * Visit number data node.
    * @param node {NumberNode} Concrete number data node.
    * @param context {IContext} Annotating context.
    */
   visitNumber(node: Ast.NumberNode, context: IContext): void {
      this.processNodes(node.__$ws_data, context);
   }

   /**
    * Visit object data node.
    * @param node {ObjectNode} Concrete object data node.
    * @param context {IContext} Annotating context.
    */
   visitObject(node: Ast.ObjectNode, context: IContext): void {
      this.processCollection(node.__$ws_properties, context);
   }

   /**
    * Visit string data node.
    * @param node {StringNode} Concrete string data node.
    * @param context {IContext} Annotating context.
    */
   visitString(node: Ast.StringNode, context: IContext): void {
      this.processNodes(node.__$ws_data, context);
   }

   /**
    * Visit value data node.
    * @param node {ValueNode} Concrete value data node.
    * @param context {IContext} Annotating context.
    */
   visitValue(node: Ast.ValueNode, context: IContext): void {
      this.processNodes(node.__$ws_data, context);
   }

   // </editor-fold>

   // <editor-fold desc="Attributes and options">

   /**
    * Visit attribute node.
    * @param node {AttributeNode} Concrete attribute node.
    * @param context {IContext} Annotating context.
    */
   visitAttribute(node: Ast.AttributeNode, context: IContext): void {
      this.processNodes(node.__$ws_value, context);
   }

   /**
    * Visit bind node.
    * @param node {BindNode} Concrete bind node.
    * @param context {IContext} Annotating context.
    */
   visitBind(node: Ast.BindNode, context: IContext): void {
      context.lexicalContext.registerProgram(node.__$ws_value, SpecialProgramType.BIND);
   }

   /**
    * Visit event handler node.
    * @param node {EventNode} Concrete event handler node.
    * @param context {IContext} Annotating context.
    */
   visitEvent(node: Ast.EventNode, context: IContext): void {
      context.lexicalContext.registerProgram(node.__$ws_handler, SpecialProgramType.EVENT);
   }

   /**
    * Visit option node.
    * @param node {OptionNode} Concrete option node.
    * @param context {IContext} Annotating context.
    */
   visitOption(node: Ast.OptionNode, context: IContext): void {
      node.__$ws_value.accept(this, context);
   }

   // </editor-fold>

   // <editor-fold desc="HTML nodes">

   /**
    * Visit CData section node.
    * @param node {CDataNode} Concrete CData section node.
    * @param context {IContext} Annotating context.
    */
   visitCData(node: Ast.CDataNode, context: IContext): void { }

   /**
    * Visit comment node.
    * @param node {CommentNode} Concrete comment node.
    * @param context {IContext} Annotating context.
    */
   visitComment(node: Ast.CommentNode, context: IContext): void { }

   /**
    * Visit content option node.
    * @param node {ContentOptionNode} Concrete content option node.
    * @param context {IContext} Annotating context.
    */
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

   /**
    * Visit doctype node.
    * @param node {DoctypeNode} Concrete doctype node.
    * @param context {IContext} Annotating context.
    */
   visitDoctype(node: Ast.DoctypeNode, context: IContext): void { }

   /**
    * Visit doctype node.
    * @param node {DoctypeNode} Concrete doctype node.
    * @param context {IContext} Annotating context.
    */
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

   /**
    * Visit instruction node.
    * @param node {InstructionNode} Concrete instruction node.
    * @param context {IContext} Annotating context.
    */
   visitInstruction(node: Ast.InstructionNode, context: IContext): void { }

   // </editor-fold>

   // <editor-fold desc="Directives">

   /**
    * Visit conditional "else" node.
    * @param node {ElseNode} Concrete conditional "else" node.
    * @param context {IContext} Annotating context.
    */
   visitElse(node: Ast.ElseNode, context: IContext): void {
      this.processNodes(node.__$ws_consequent, context);
      if (node.__$ws_test) {
         context.lexicalContext.registerProgram(node.__$ws_test);
      }
      if (node.__$ws_alternate) {
         node.__$ws_alternate.accept(this, context);
      }
   }

   /**
    * Visit "for" cycle node.
    * @param node {ForNode} Concrete "for" cycle node.
    * @param context {IContext} Annotating context.
    */
   visitFor(node: Ast.ForNode, context: IContext): void {
      const lexicalContext = context.lexicalContext.createContext();
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      if (node.__$ws_init) {
         lexicalContext.registerProgram(node.__$ws_init, SpecialProgramType.FLOAT);
      }
      lexicalContext.registerProgram(node.__$ws_test, SpecialProgramType.FLOAT);
      if (node.__$ws_update) {
         lexicalContext.registerProgram(node.__$ws_update, SpecialProgramType.FLOAT);
      }
      this.processNodes(node.__$ws_content, contentContext);
      node.__$ws_lexicalContext = lexicalContext;
   }

   /**
    * Visit "foreach" cycle node.
    * @param node {ForeachNode} Concrete "foreach" cycle node.
    * @param context {IContext} Annotating context.
    */
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
      lexicalContext.registerProgram(node.__$ws_collection);
      this.processNodes(node.__$ws_content, contentContext);
      node.__$ws_lexicalContext = lexicalContext;
   }

   /**
    * Visit conditional "if" node.
    * @param node {IfNode} Concrete conditional "if" node.
    * @param context {IContext} Annotating context.
    */
   visitIf(node: Ast.IfNode, context: IContext): void {
      this.processNodes(node.__$ws_consequent, context);
      context.lexicalContext.registerProgram(node.__$ws_test);
      if (node.__$ws_alternate) {
         node.__$ws_alternate.accept(this, context);
      }
   }

   /**
    * Visit template node.
    * @param node {TemplateNode} Concrete template node.
    * @param context {IContext} Annotating context.
    */
   visitTemplate(node: Ast.TemplateNode, context: IContext): void {
      const lexicalContext = context.lexicalContext.createContext({
         type: ContextType.ISOLATED
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

   /**
    * Visit mustache expression node.
    * @param node {ExpressionNode} Concrete mustache expression node.
    * @param context {IContext} Annotating context.
    */
   visitExpression(node: Ast.ExpressionNode, context: IContext): void {
      context.lexicalContext.registerProgram(node.__$ws_program);
   }

   /**
    * Visit shared text node.
    * @param node {TextNode} Concrete shared text node.
    * @param context {IContext} Annotating context.
    */
   visitText(node: Ast.TextNode, context: IContext): void {
      this.processNodes(node.__$ws_content, context);
   }

   /**
    * Visit text data node.
    * @param node {TextDataNode} Concrete text data node.
    * @param context {IContext} Annotating context.
    */
   visitTextData(node: Ast.TextDataNode, context: IContext): void { }

   /**
    * Visit translation node.
    * @param node {TranslationNode} Concrete translation node.
    * @param context {IContext} Annotating context.
    */
   visitTranslation(node: Ast.TranslationNode, context: IContext): void { }

   // </editor-fold>

   // <editor-fold desc="Components and templates">

   /**
    * Visit component node.
    * @param node {ComponentNode} Concrete component node.
    * @param context {IContext} Annotating context.
    */
   visitComponent(node: Ast.ComponentNode, context: IContext): void {
      const lexicalContext = context.lexicalContext.createContext({
         type: ContextType.INTERMEDIATE
      });
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      this.processComponentContent(node, contentContext);
   }

   /**
    * Visit dynamic partial node.
    * @param node {DynamicPartialNode} Concrete dynamic partial node.
    * @param context {IContext} Annotating context.
    */
   visitDynamicPartial(node: Ast.DynamicPartialNode, context: IContext): void {
      const lexicalContext = context.lexicalContext.createContext({
         type: ContextType.INTERMEDIATE
      });
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      this.processComponentContent(node, contentContext);
      lexicalContext.registerProgram(node.__$ws_expression);
   }

   /**
    * Visit inline template node.
    * @param node {InlineTemplateNode} Concrete inline template node.
    * @param context {IContext} Annotating context.
    */
   visitInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): void {
      const template = context.scope.getTemplate(node.__$ws_name);
      const identifiers = collectInlineTemplateIdentifiers(node);
      const lexicalContext = context.lexicalContext.createContext({
         type: ContextType.INTERMEDIATE
      });
      lexicalContext.joinContext(template.__$ws_lexicalContext, { identifiers });
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      this.processComponentContent(node, contentContext);
   }

   /**
    * Visit static template node.
    * @param node {StaticPartialNode} Concrete static template node.
    * @param context {IContext} Annotating context.
    */
   visitStaticPartial(node: Ast.StaticPartialNode, context: IContext): void {
      const lexicalContext = context.lexicalContext.createContext({
         type: ContextType.INTERMEDIATE
      });
      const contentContext: IContext = {
         ...context,
         lexicalContext
      };
      this.processComponentContent(node, contentContext);
   }

   // </editor-fold>

   /**
    * Process collection of options or object properties.
    * @param collection {IOptions | IObjectProperties} Collection of options or object properties.
    * @param context {IContext} Annotating context.
    */
   private processCollection(collection: Ast.IOptions | Ast.IObjectProperties, context: IContext): void {
      for (const name in collection) {
         const property = collection[name];
         property.accept(this, context);
      }
   }

   /**
    * Process collection of nodes of abstract syntax tree.
    * @param nodes {Ast[]} Collection of nodes of abstract syntax tree.
    * @param context {IContext} Annotating context.
    */
   private processNodes(nodes: Ast.Ast[], context: IContext): void {
      nodes.forEach((node: Ast.Ast) => {
         node.accept(this, context);
      });
   }

   /**
    * Process component content.
    * @param node {BaseWasabyElement} Component node.
    * @param context {IContext} Annotating context.
    */
   private processComponentContent(node: Ast.BaseWasabyElement, context: IContext): void {
      const name = getComponentName(node);
      if (name !== null) {
         context.childrenStorage.push(name);
      }
      const afterInternalNodes: Ast.Ast[] = [];
      for (const name in node.__$ws_options) {
         const option = node.__$ws_options[name];
         if (option.__$ws_name === "scope") {
            option.accept(this, context);
            continue;
         }
         afterInternalNodes.push(option);
      }
      for (const name in node.__$ws_contents) {
         const content = node.__$ws_contents[name];
         afterInternalNodes.push(content);
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
