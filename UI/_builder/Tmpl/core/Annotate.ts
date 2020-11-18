/// <amd-module name="UI/_builder/Tmpl/core/Annotate" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Annotate.ts
 */

import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import { ProgramNode, IdentifierNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import Scope from 'UI/_builder/Tmpl/core/Scope';

// <editor-fold desc="Public interfaces and functions">

export interface IAnnotatedTree extends Array<Ast.Ast> {
   childrenStorage: string[];
   reactiveProps: string[];
   templateNames: string[];
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

interface IStorage {
   [name: string]: boolean;
}

interface IContext {
   childrenStorage: string[];
   identifiersStore: IStorage;
   scope: Scope;
}

interface IScopePreprocess {
   ignoredIdentifiers: IStorage;
}

interface ICyclePreprocess extends IScopePreprocess {
   expressions: Ast.ExpressionNode[];
   additionalIdentifiers: string[];
}

const EMPTY_ARRAY = [];

const NOT_REACTIVE_IDENTIFIERS = [
   '...',
   '_options',
   '_container',
   '_children',
   'rk'
];

const INTERNAL_EXPRESSION_PREFIX = '__dirtyCheckingVars_';

// TODO: Accept parser from config
const PARSER = new Parser();

// </editor-fold>

// <editor-fold desc="Private annotation functions">

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

function hasBindings(node: Ast.ExpressionNode): boolean {
   if (typeof node.__$ws_program.string !== 'string') {
      return false;
   }
   return node.__$ws_program.string.indexOf('|mutable') > -1 || node.__$ws_program.string.indexOf('|bind') > -1;
}

function appendInternalExpressions(internal: Ast.IInternal, expressions: Ast.ExpressionNode[]): void {
   let expressionIndex = 0;
   const srcProgramMap = { };
   for (let index = 0; index < expressions.length; ++index) {
      const expression = expressions[index];
      if (hasBindings(expression)) {
         continue;
      }

      // Do not append the same expressions to internal collection
      const key = '' + expression.__$ws_program.string + '';
      if (srcProgramMap[key]) {
         continue;
      }
      srcProgramMap[key] = true;

      internal[INTERNAL_EXPRESSION_PREFIX + (expressionIndex++)] = {
         data: [
            expressions[index]
         ],
         type: 'text'
      };
   }
}

function collectNonIgnoredIdentifiers(expression: Ast.ExpressionNode, ignoredIdentifiers: IStorage): Ast.ExpressionNode[] {
   let hasIgnored = false;
   const identifiersAsExpressions: Ast.ExpressionNode[] = [];
   const callbacks = {
      Identifier: (data: any): any => {
         if (ignoredIdentifiers.hasOwnProperty(data.name)) {
            hasIgnored = true;
            return;
         } else {
            identifiersAsExpressions.push(
               new Ast.ExpressionNode(
                  PARSER.parse(data.name)
               )
            );
         }
      }
   };
   const walker = new Walker(callbacks);
   expression.__$ws_program.accept(walker, {
      fileName: 'Unknown'
   });
   return hasIgnored ? identifiersAsExpressions : [];
}

function wrestNonIgnoredIdentifiers(expressions: Ast.ExpressionNode[], ignoredIdentifiers: IStorage): Ast.ExpressionNode[] {
   let identifiersAsExpressions: Ast.ExpressionNode[] = [];
   for (let index = 0; index < expressions.length; ++index) {
      identifiersAsExpressions = identifiersAsExpressions.concat(
         collectNonIgnoredIdentifiers(expressions[index], ignoredIdentifiers)
      );
   }
   return identifiersAsExpressions;
}

function hasIgnoredIdentifier(expression: Ast.ExpressionNode, ignoredIdentifiers: IStorage): boolean {
   let hasIgnored = false;
   const callbacks = {
      Identifier: (data: any): any => {
         if (ignoredIdentifiers.hasOwnProperty(data.name)) {
            hasIgnored = true;
         }
      }
   };
   const walker = new Walker(callbacks);
   expression.__$ws_program.accept(walker, {
      fileName: 'Unknown'
   });
   return hasIgnored;
}

function excludeIgnoredExpressions(expressions: Ast.ExpressionNode[], ignoredIdentifiers: IStorage): Ast.ExpressionNode[] {
   const result: Ast.ExpressionNode[] = [];
   for (let index = 0; index < expressions.length; ++index) {
      if (!hasIgnoredIdentifier(expressions[index], ignoredIdentifiers)) {
         result.push(expressions[index]);
      }
   }
   return result;
}

function collectIdentifiers(program: ProgramNode): string[] {
   const result: string[] = [];
   const callbacks = {
      Identifier: (node: IdentifierNode): void => {
         result.push(node.name);
      }
   };
   const walker = new Walker(callbacks);
   program.accept(walker, {
      fileName: 'Unknown'
   });
   return result;
}

function collectDroppedExpressions(program: ProgramNode): ProgramNode[] {
   const result: ProgramNode[] = [];
   const callbacks = {
      Identifier: (node: any): any => {
         result.push(
            PARSER.parse(node.name)
         );
      },
      MemberExpression: (node: any): any => {
         result.push(
            PARSER.parse(node.string)
         );
      }
   };
   const walker = new Walker(callbacks);
   program.accept(walker, {
      fileName: 'Unknown'
   });
   return result.slice(-2);
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

function processProgramNode(node: ProgramNode, context: IContext): Ast.ExpressionNode[] {
   const identifiers = collectIdentifiers(node);
   identifiers.forEach((identifier: string) => {
      context.identifiersStore[identifier] = true;
   });
   if (identifiers.length === 0) {
      return EMPTY_ARRAY;
   }
   return [
      new Ast.ExpressionNode(node)
   ];
}

function addIgnoredIdentifiers(program: ProgramNode, ignoredIdentifiers: IStorage): string[] {
   const identifiers = collectIdentifiers(program);
   identifiers.forEach((identifier: string) => {
      ignoredIdentifiers[identifier] = true;
   });
   return identifiers;
}

function addIgnoredAndAdditionalIdentifiers(program: ProgramNode, ignoredIdentifiers: IStorage, additionalIdentifiers: string[]): void {
   addIgnoredIdentifiers(program, ignoredIdentifiers).forEach((identifier: string) => {
      if (additionalIdentifiers.indexOf(identifier) === -1) {
         additionalIdentifiers.push(identifier);
      }
   });
}

function processBeforeFor(node: Ast.ForNode, context: IContext): ICyclePreprocess {
   const ignoredIdentifiers: IStorage = { };
   const additionalIdentifiers: string[] = [];
   let expressions: Ast.ExpressionNode[] = [];
   if (node.__$ws_init) {
      addIgnoredAndAdditionalIdentifiers(node.__$ws_init, ignoredIdentifiers, additionalIdentifiers);
   }
   addIgnoredAndAdditionalIdentifiers(node.__$ws_test, ignoredIdentifiers, additionalIdentifiers);
   if (node.__$ws_update) {
      addIgnoredAndAdditionalIdentifiers(node.__$ws_update, ignoredIdentifiers, additionalIdentifiers);
   }
   return {
      ignoredIdentifiers,
      additionalIdentifiers,
      expressions
   };
}

function processAfterFor(cyclePreprocess: ICyclePreprocess, context: IContext): Ast.ExpressionNode[] {
   cyclePreprocess.expressions = cyclePreprocess.expressions.concat(
      wrestNonIgnoredIdentifiers(cyclePreprocess.expressions, cyclePreprocess.ignoredIdentifiers)
   );
   cyclePreprocess.expressions = excludeIgnoredExpressions(cyclePreprocess.expressions, cyclePreprocess.ignoredIdentifiers);
   cleanIgnoredIdentifiersFromReactive(context.identifiersStore, cyclePreprocess.ignoredIdentifiers);

   for (let index = 0; index < cyclePreprocess.additionalIdentifiers.length; ++index) {
      const identifier = cyclePreprocess.additionalIdentifiers[index];
      cyclePreprocess.expressions.push(
         new Ast.ExpressionNode(
            PARSER.parse(identifier)
         )
      );
      context.identifiersStore[identifier] = true;
   }
   return cyclePreprocess.expressions;
}

function processBeforeForeach(node: Ast.ForeachNode, context: IContext): ICyclePreprocess {
   const ignoredIdentifiers: IStorage = { };
   if (node.__$ws_index) {
      addIgnoredIdentifiers(node.__$ws_index, ignoredIdentifiers);
   }
   addIgnoredIdentifiers(node.__$ws_iterator, ignoredIdentifiers);
   const expressions: Ast.ExpressionNode[] = processProgramNode(node.__$ws_collection, context);
   return {
      ignoredIdentifiers,
      expressions,
      additionalIdentifiers: []
   };
}

function processAfterForeach(cyclePreprocess: ICyclePreprocess, context: IContext): Ast.ExpressionNode[] {
   cyclePreprocess.expressions = cyclePreprocess.expressions.concat(
      wrestNonIgnoredIdentifiers(cyclePreprocess.expressions, cyclePreprocess.ignoredIdentifiers)
   );
   cyclePreprocess.expressions = excludeIgnoredExpressions(cyclePreprocess.expressions, cyclePreprocess.ignoredIdentifiers);
   cleanIgnoredIdentifiersFromReactive(context.identifiersStore, cyclePreprocess.ignoredIdentifiers);
   return cyclePreprocess.expressions;
}

function cleanIgnoredIdentifiersFromReactive(identifiersStore: IStorage, ignoredIdentifiers: IStorage): void {
   for (const ignoredIdentifier in ignoredIdentifiers) {
      if (identifiersStore[ignoredIdentifier]) {
         delete identifiersStore[ignoredIdentifier];
      }
   }
}

// </editor-fold>

class AnnotateProcessor implements Ast.IAstVisitor, IAnnotateProcessor {

   annotate(nodes: Ast.Ast[], scope: Scope): IAnnotatedTree {
      const childrenStorage: string[] = [ ];
      let globalIdentifiersStore: IStorage = { };
      nodes.forEach((node: Ast.Ast) => {
         const identifiersStore: IStorage = { };
         const context: IContext = {
            childrenStorage,
            identifiersStore,
            scope
         };
         const expressions: Ast.ExpressionNode[] = node.accept(this, context);
         node.__$ws_internal = { };
         appendInternalExpressions(node.__$ws_internal, expressions);
         globalIdentifiersStore = {
            ...globalIdentifiersStore,
            ...identifiersStore
         };
      });
      const reactiveProperties: string[] = Object
         .keys(globalIdentifiersStore)
         .filter((item: string) => NOT_REACTIVE_IDENTIFIERS.indexOf(item) === -1);
      const result = <IAnnotatedTree>nodes;
      result.childrenStorage = childrenStorage;
      result.reactiveProps = reactiveProperties;
      result.templateNames = scope.getTemplateNames();
      result.__newVersion = true;
      return result;
   }

   // <editor-fold desc="Data types">

   visitArray(node: Ast.ArrayNode, context: IContext): Ast.ExpressionNode[] {
      return this.processNodes(node.__$ws_elements, context);
   }

   visitBoolean(node: Ast.BooleanNode, context: IContext): Ast.ExpressionNode[] {
      return this.processNodes(node.__$ws_data, context);
   }

   visitFunction(node: Ast.FunctionNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = this.processCollection(node.__$ws_options, context);
      expressions = expressions.concat(
         this.processNodes(node.__$ws_functionExpression, context)
      );
      return expressions;
   }

   visitNumber(node: Ast.NumberNode, context: IContext): Ast.ExpressionNode[] {
      return this.processNodes(node.__$ws_data, context);
   }

   visitObject(node: Ast.ObjectNode, context: IContext): Ast.ExpressionNode[] {
      return this.processCollection(node.__$ws_properties, context);
   }

   visitString(node: Ast.StringNode, context: IContext): Ast.ExpressionNode[] {
      return this.processNodes(node.__$ws_data, context);
   }

   visitValue(node: Ast.ValueNode, context: IContext): Ast.ExpressionNode[] {
      return this.processNodes(node.__$ws_data, context);
   }

   // </editor-fold>

   // <editor-fold desc="Attributes and options">

   visitAttribute(node: Ast.AttributeNode, context: IContext): Ast.ExpressionNode[] {
      return this.processNodes(node.__$ws_value, context);
   }

   visitBind(node: Ast.BindNode, context: IContext): Ast.ExpressionNode[] {
      const programs = collectDroppedExpressions(node.__$ws_value);
      const expressions: Ast.ExpressionNode[] = [];
      programs.forEach((program: ProgramNode) => {
         const identifiers = collectIdentifiers(program);
         expressions.push(
            new Ast.ExpressionNode(program)
         );
         identifiers.forEach((identifier: string) => {
            context.identifiersStore[identifier] = true;
         });
      });
      return expressions;
   }

   visitEvent(node: Ast.EventNode, context: IContext): Ast.ExpressionNode[] {
      const identifiers = collectIdentifiers(node.__$ws_handler);
      identifiers.forEach((identifier: string) => {
         context.identifiersStore[identifier] = true;
      });
      return [];
   }

   visitOption(node: Ast.OptionNode, context: IContext): Ast.ExpressionNode[] {
      return node.__$ws_value.accept(this, context);
   }

   // </editor-fold>

   // <editor-fold desc="HTML nodes">

   visitCData(node: Ast.CDataNode, context: IContext): Ast.ExpressionNode[] {
      return EMPTY_ARRAY;
   }

   visitComment(node: Ast.CommentNode, context: IContext): Ast.ExpressionNode[] {
      return EMPTY_ARRAY;
   }

   visitContentOption(node: Ast.ContentOptionNode, context: IContext): Ast.ExpressionNode[] {
      const ignoredIdentifiers: IStorage = { };
      let expressions: Ast.ExpressionNode[] = this.processNodes(node.__$ws_content, context);
      ignoredIdentifiers[node.__$ws_name] = true;
      setRootNodeFlags(node.__$ws_content);
      node.__$ws_internal = { };
      appendInternalExpressions(node.__$ws_internal, expressions);
      expressions = expressions.concat(wrestNonIgnoredIdentifiers(expressions, ignoredIdentifiers));
      expressions = excludeIgnoredExpressions(expressions, ignoredIdentifiers);
      cleanIgnoredIdentifiersFromReactive(context.identifiersStore, ignoredIdentifiers);
      return expressions;
   }

   visitDoctype(node: Ast.DoctypeNode, context: IContext): Ast.ExpressionNode[] {
      return EMPTY_ARRAY;
   }

   visitElement(node: Ast.ElementNode, context: IContext): Ast.ExpressionNode[] {
      const name = getElementName(node);
      if (name !== null) {
         context.childrenStorage.push(name);
      }
      let expressions: Ast.ExpressionNode[] = this.processNodes(node.__$ws_content, context);
      this.processElementAttributes(node, context, expressions);
      return expressions;
   }

   visitInstruction(node: Ast.InstructionNode, context: IContext): Ast.ExpressionNode[] {
      return EMPTY_ARRAY;
   }

   // </editor-fold>

   // <editor-fold desc="Directives">

   visitElse(node: Ast.ElseNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = this.processNodes(node.__$ws_consequent, context);
      if (node.__$ws_test) {
         expressions = expressions.concat(
            processProgramNode(node.__$ws_test, context)
         );
      }
      if (node.__$ws_alternate) {
         expressions = expressions.concat(
            node.__$ws_alternate.accept(this, context)
         );
      }
      return expressions;
   }

   visitFor(node: Ast.ForNode, context: IContext): Ast.ExpressionNode[] {
      const cyclePreprocess: ICyclePreprocess = processBeforeFor(node, context);

      cyclePreprocess.expressions = cyclePreprocess.expressions.concat(
         this.processNodes(node.__$ws_content, context)
      );

      return processAfterFor(cyclePreprocess, context);
   }

   visitForeach(node: Ast.ForeachNode, context: IContext): Ast.ExpressionNode[] {
      const cyclePreprocess: ICyclePreprocess = processBeforeForeach(node, context);

      cyclePreprocess.expressions = cyclePreprocess.expressions.concat(
         this.processNodes(node.__$ws_content, context)
      );

      return processAfterForeach(cyclePreprocess, context);
   }

   visitIf(node: Ast.IfNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = this.processNodes(node.__$ws_consequent, context);
      // FIXME: Legacy error. Test can be invalid. Enable traverse check
      if (node.__$ws_test) {
         expressions = expressions.concat(
            processProgramNode(node.__$ws_test, context)
         );
      }
      if (node.__$ws_alternate) {
         expressions = expressions.concat(
            node.__$ws_alternate.accept(this, context)
         );
      }
      return expressions;
   }

   visitTemplate(node: Ast.TemplateNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = this.processNodes(node.__$ws_content, context);
      setRootNodeFlags(node.__$ws_content);
      node.__$ws_internal = { };
      appendInternalExpressions(node.__$ws_internal, expressions);
      return expressions;
   }

   // </editor-fold>

   // <editor-fold desc="Extended text">

   visitExpression(node: Ast.ExpressionNode, context: IContext): Ast.ExpressionNode[] {
      return processProgramNode(node.__$ws_program, context);
   }

   visitText(node: Ast.TextNode, context: IContext): Ast.ExpressionNode[] {
      return this.processNodes(node.__$ws_content, context);
   }

   visitTextData(node: Ast.TextDataNode, context: IContext): Ast.ExpressionNode[] {
      return EMPTY_ARRAY;
   }

   visitTranslation(node: Ast.TranslationNode, context: IContext): Ast.ExpressionNode[] {
      return EMPTY_ARRAY;
   }

   // </editor-fold>

   // <editor-fold desc="Components and templates">

   visitComponent(node: Ast.ComponentNode, context: IContext): Ast.ExpressionNode[] {
      return this.processBaseWasabyElement(node, context);
   }

   visitDynamicPartial(node: Ast.DynamicPartialNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = this.processBaseWasabyElement(node, context);
      expressions = processProgramNode(node.__$ws_expression, context).concat(expressions);
      return expressions;
   }

   visitInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): Ast.ExpressionNode[] {
      const initialExpressions = context.scope.getTemplate(node.__$ws_name).accept(this, context);
      const scopePreprocess: IScopePreprocess = this.processBeforeInlineTemplate(node, context);
      const expressions = this.processBaseWasabyElement(node, context, initialExpressions);
      return this.processAfterInlineTemplate(scopePreprocess, context, expressions);
   }

   private processBeforeInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): IScopePreprocess {
      // FIXME: Opt double proc
      const ignoredIdentifiers: IStorage = { };
      for (const name in node.__$ws_options) {
         const option = node.__$ws_options[name];
         const optionExpressions: Ast.ExpressionNode[] = option.accept(this, context);
         if (optionExpressions.length === 0) {
            continue;
         }
         // option="{{ expr1 }}-{{ expr2 }}" complex expressions must be ignored
         if (optionExpressions.length > 1) {
            ignoredIdentifiers[option.__$ws_name] = true;
            continue;
         }
         // option="option" is simple alias and deep usages exist in current scope
         if (option.__$ws_name !== optionExpressions[0].__$ws_program.string) {
            ignoredIdentifiers[option.__$ws_name] = true;
         }
      }
      for (const name in node.__$ws_events) {
         const event = node.__$ws_events[name];
         if (event instanceof Ast.BindNode) {
            // bind:option="option" is simple alias and deep usages exist in current scope
            if (event.__$ws_property !== event.__$ws_value.string) {
               ignoredIdentifiers[event.__$ws_property] = true;
            }
         }
      }
      return {
         ignoredIdentifiers
      };
   }

   private processAfterInlineTemplate(scopePreprocess: IScopePreprocess, context: IContext, expressions: Ast.ExpressionNode[]): Ast.ExpressionNode[] {
      // FIXME: Indep proc
      let actualExpressions: Ast.ExpressionNode[] = expressions;
      actualExpressions = actualExpressions.concat(
         wrestNonIgnoredIdentifiers(actualExpressions, scopePreprocess.ignoredIdentifiers)
      );
      actualExpressions = excludeIgnoredExpressions(actualExpressions, scopePreprocess.ignoredIdentifiers);
      cleanIgnoredIdentifiersFromReactive(context.identifiersStore, scopePreprocess.ignoredIdentifiers);
      return actualExpressions;
   }

   visitStaticPartial(node: Ast.StaticPartialNode, context: IContext): Ast.ExpressionNode[] {
      return this.processBaseWasabyElement(node, context);
   }

   // </editor-fold>

   private processCollection(collection: Ast.IOptions | Ast.IObjectProperties, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      for (const name in collection) {
         const property = collection[name];
         expressions = expressions.concat(property.accept(this, context));
      }
      return expressions;
   }

   private processNodes(nodes: Ast.Ast[], context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      nodes.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   private processBaseWasabyElement(node: Ast.BaseWasabyElement, context: IContext, initialExpressions: Ast.ExpressionNode[] = []): Ast.ExpressionNode[] {
      const name = getComponentName(node);
      if (name !== null) {
         context.childrenStorage.push(name);
      }
      let expressions: Ast.ExpressionNode[] = initialExpressions;
      this.processInjectedData(node, context, expressions);
      // Important: there are some expressions that must be in component internal collection.
      const componentOnlyExpressions: Ast.ExpressionNode[] = this.processComponentAttributes(node, context, expressions);
      node.__$ws_internal = { };
      appendInternalExpressions(node.__$ws_internal, componentOnlyExpressions);
      return expressions;
   }

   private processElementAttributes(node: Ast.BaseHtmlElement, context: IContext, expressions: Ast.ExpressionNode[]): void {
      // FIXME: Remove order repairing
      const chain = [];
      for (const name in node.__$ws_attributes) {
         const attribute = node.__$ws_attributes[name];
         chain.push(attribute);
      }
      for (const name in node.__$ws_events) {
         const event = node.__$ws_events[name];
         chain.push(event);
      }
      chain.sort((prev: Ast.Ast, next: Ast.Ast) => prev.__$ws_key - next.__$ws_key);
      chain.forEach((node: Ast.Ast) => {
         node.accept(this, context).forEach((expression: Ast.ExpressionNode) => {
            expressions.push(expression);
         });
      });
   }

   private processComponentAttributes(node: Ast.BaseWasabyElement, context: IContext, expressions: Ast.ExpressionNode[]): Ast.ExpressionNode[] {
      // FIXME: Remove order repairing
      const chain: Ast.Ast[] = [];
      const componentOnlyExpressions: Ast.ExpressionNode[] = [].concat(expressions);
      for (const name in node.__$ws_attributes) {
         chain.push(node.__$ws_attributes[name]);
      }
      for (const name in node.__$ws_events) {
         chain.push(node.__$ws_events[name]);
      }
      for (const name in node.__$ws_options) {
         const option = node.__$ws_options[name];
         if (!option.hasFlag(Ast.Flags.UNPACKED)) {
            continue;
         }
         chain.push(option);
      }
      chain.sort((prev: Ast.Ast, next: Ast.Ast) => prev.__$ws_key - next.__$ws_key);
      chain.forEach((node: Ast.Ast) => {
         node.accept(this, context).forEach((expression: Ast.ExpressionNode) => {
            expressions.push(expression);
            // Important: bind expressions must be in component internal collection.
            if (node instanceof Ast.BindNode) {
               componentOnlyExpressions.push(expression);
               return;
            }
         });
      });
      return componentOnlyExpressions;
   }

   private processInjectedData(node: Ast.BaseWasabyElement, context: IContext, expressions: Ast.ExpressionNode[]): void {
      // FIXME: Remove order repairing
      const chain: Ast.Ast[] = [];
      for (const name in node.__$ws_options) {
         const option = node.__$ws_options[name];
         if (option.hasFlag(Ast.Flags.UNPACKED)) {
            continue;
         }
         chain.push(option);
      }
      for (const name in node.__$ws_contents) {
         const content = node.__$ws_contents[name];
         if (content.hasFlag(Ast.Flags.NEST_CASTED)) {
            content.accept(this, context).forEach((expression: Ast.ExpressionNode) => {
               expressions.push(expression);
            });
            return;
         }
         chain.push(content);
      }
      chain.sort((prev: Ast.Ast, next: Ast.Ast) => prev.__$ws_key - next.__$ws_key);
      chain.forEach((node: Ast.Ast) => {
         node.accept(this, context).forEach((expression: Ast.ExpressionNode) => {
            expressions.push(expression);
         });
      })
   }
}
