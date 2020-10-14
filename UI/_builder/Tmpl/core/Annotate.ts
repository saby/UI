/// <amd-module name="UI/_builder/Tmpl/core/Annotate" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Annotate.ts
 */

import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import { ProgramNode, IdentifierNode, Walker } from 'UI/_builder/Tmpl/expressions/_private/Nodes';
import { Parser } from 'UI/_builder/Tmpl/expressions/_private/Parser';

interface IAnnotatedTree extends Array<Ast.Ast> {
   childrenStorage: string[];
   reactiveProps: string[];
   __newVersion: boolean;
}

export interface IAnnotateProcessor {
   annotate(nodes: Ast.Ast[]): IAnnotatedTree;
}

interface IStorage {
   [name: string]: boolean;
}

interface IContext {
   childrenStorage: string[];
   identifiersStore: IStorage;
}

interface ICyclePreprocess {
   ignoredIdentifiers: IStorage;
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

const PARSER = new Parser();

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
   for (let index = 0; index < expressions.length; ++index) {
      const expression = expressions[index];
      if (hasBindings(expression)) {
         continue;
      }

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

   for (let index = 0; index < cyclePreprocess.additionalIdentifiers.length; ++index) {
      cyclePreprocess.expressions.push(
         new Ast.ExpressionNode(
            PARSER.parse(cyclePreprocess.additionalIdentifiers[index])
         )
      );
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
   return cyclePreprocess.expressions;
}

class AnnotateProcessor implements Ast.IAstVisitor, IAnnotateProcessor {

   annotate(nodes: Ast.Ast[]): IAnnotatedTree {
      const childrenStorage: string[] = [ ];
      const identifiersStore: IStorage = { };
      nodes.forEach((node: Ast.Ast) => {
         const context: IContext = {
            childrenStorage,
            identifiersStore
         };
         const expressions: Ast.ExpressionNode[] = node.accept(this, context);
         node.__$ws_internal = { };
         appendInternalExpressions(node.__$ws_internal, expressions);
      });
      const reactiveProperties: string[] = Object
         .keys(identifiersStore)
         .filter((item: string) => NOT_REACTIVE_IDENTIFIERS.indexOf(item) === -1);
      const result = <IAnnotatedTree>nodes;
      result.childrenStorage = childrenStorage;
      result.reactiveProps = reactiveProperties;
      result.__newVersion = true;
      return result;
   }

   // <editor-fold desc="Data types">

   visitArray(node: Ast.ArrayNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      node.__$ws_elements.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   visitBoolean(node: Ast.BooleanNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      node.__$ws_data.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   visitFunction(node: Ast.FunctionNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      node.__$ws_functionExpression.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      for (const name in node.__$ws_options) {
         const property = node.__$ws_options[name];
         expressions = expressions.concat(property.accept(this, context));
      }
      return expressions;
   }

   visitNumber(node: Ast.NumberNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      node.__$ws_data.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   visitObject(node: Ast.ObjectNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      for (const name in node.__$ws_properties) {
         const property = node.__$ws_properties[name];
         expressions = expressions.concat(property.accept(this, context));
      }
      return expressions;
   }

   visitString(node: Ast.StringNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      node.__$ws_data.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   visitValue(node: Ast.ValueNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      node.__$ws_data.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   // </editor-fold>

   // <editor-fold desc="Attributes and options">

   visitAttribute(node: Ast.AttributeNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      node.__$ws_value.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
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
      let expressions: Ast.ExpressionNode[] = [];
      ignoredIdentifiers[node.__$ws_name] = true;
      node.__$ws_content.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      setRootNodeFlags(node.__$ws_content);
      node.__$ws_internal = { };
      appendInternalExpressions(node.__$ws_internal, expressions);
      expressions = expressions.concat(wrestNonIgnoredIdentifiers(expressions, ignoredIdentifiers));
      expressions = excludeIgnoredExpressions(expressions, ignoredIdentifiers);
      return expressions;
   }

   visitDoctype(node: Ast.DoctypeNode, context: IContext): Ast.ExpressionNode[] {
      return EMPTY_ARRAY;
   }

   visitElement(node: Ast.ElementNode, context: IContext): Ast.ExpressionNode[] {
      if (!node.__$ws_unpackedCycle) {
         return this.processElement(node, context);
      }
      const cyclePreprocess: ICyclePreprocess = node.__$ws_unpackedCycle instanceof Ast.ForNode
         ? processBeforeFor(node.__$ws_unpackedCycle, context)
         : processBeforeForeach(node.__$ws_unpackedCycle, context);
      cyclePreprocess.expressions = cyclePreprocess.expressions.concat(
         this.processElement(node, context)
      );
      return node.__$ws_unpackedCycle instanceof Ast.ForNode
         ? processAfterFor(cyclePreprocess, context)
         : processAfterForeach(cyclePreprocess, context);
   }

   visitInstruction(node: Ast.InstructionNode, context: IContext): Ast.ExpressionNode[] {
      return EMPTY_ARRAY;
   }

   // </editor-fold>

   // <editor-fold desc="Directives">

   visitElse(node: Ast.ElseNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      node.__$ws_consequent.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      if (node.__$ws_test) {
         expressions = expressions.concat(
            processProgramNode(node.__$ws_test, context)
         );
      }
      if (node.__$ws_alternate) {
         expressions = expressions.concat(node.__$ws_alternate.accept(this, context));
      }
      return expressions;
   }

   visitFor(node: Ast.ForNode, context: IContext): Ast.ExpressionNode[] {
      const cyclePreprocess: ICyclePreprocess = processBeforeFor(node, context);

      node.__$ws_content.forEach((node: Ast.Ast) => {
         cyclePreprocess.expressions = cyclePreprocess.expressions.concat(node.accept(this, context));
      });

      return processAfterFor(cyclePreprocess, context);
   }

   visitForeach(node: Ast.ForeachNode, context: IContext): Ast.ExpressionNode[] {
      const cyclePreprocess: ICyclePreprocess = processBeforeForeach(node, context);

      node.__$ws_content.forEach((node: Ast.Ast) => {
         cyclePreprocess.expressions = cyclePreprocess.expressions.concat(node.accept(this, context));
      });

      return processAfterForeach(cyclePreprocess, context);
   }

   visitIf(node: Ast.IfNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      node.__$ws_consequent.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      expressions = expressions.concat(processProgramNode(node.__$ws_test, context));
      if (node.__$ws_alternate) {
         expressions = expressions.concat(node.__$ws_alternate.accept(this, context));
      }
      return expressions;
   }

   visitTemplate(node: Ast.TemplateNode, context: IContext): Ast.ExpressionNode[] {
      let expressions: Ast.ExpressionNode[] = [];
      node.__$ws_content.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
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
      let expressions: Ast.ExpressionNode[] = [];
      node.__$ws_content.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
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
      let expressions: Ast.ExpressionNode[] = [];
      expressions = expressions.concat(
         this.processBaseWasabyElement(node, context)
      );
      expressions = expressions.concat(
         processProgramNode(node.__$ws_expression, context)
      );
      return expressions;
   }

   visitInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): Ast.ExpressionNode[] {
      return this.processBaseWasabyElement(node, context);
   }

   visitStaticPartial(node: Ast.StaticPartialNode, context: IContext): Ast.ExpressionNode[] {
      return this.processBaseWasabyElement(node, context);
   }

   // </editor-fold>

   private processElement(node: Ast.ElementNode, context: IContext): Ast.ExpressionNode[] {
      const name = getElementName(node);
      let expressions: Ast.ExpressionNode[] = [];
      if (name !== null) {
         context.childrenStorage.push(name);
      }
      node.__$ws_content.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      this.processElementAttributes(node, context, expressions);
      return expressions;
   }

   private processBaseWasabyElement(node: Ast.BaseWasabyElement, context: IContext): Ast.ExpressionNode[] {
      const name = getComponentName(node);
      let expressions: Ast.ExpressionNode[] = [];
      if (name !== null) {
         context.childrenStorage.push(name);
      }
      this.processInjectedData(node, context, expressions);
      node.__$ws_internal = { };
      appendInternalExpressions(node.__$ws_internal, expressions);
      this.processComponentAttributes(node, context, expressions);
      return expressions;
   }

   /**
    * Process attributes keeping the nodes order
    * @deprecated
    * @param node
    * @param context
    * @param expressions
    */
   private processElementAttributes(node: Ast.BaseHtmlElement, context: IContext, expressions: Ast.ExpressionNode[]) {
      const chain = [];
      for (const name in node.__$ws_attributes) {
         const attribute = node.__$ws_attributes[name];
         chain.splice(attribute.__$ws_key, 0, attribute);
      }
      for (const name in node.__$ws_events) {
         const event = node.__$ws_events[name];
         chain.splice(event.__$ws_key, 0, event);
      }
      chain.forEach((node: Ast.Ast) => {
         node.accept(this, context).forEach((expression: Ast.ExpressionNode) => {
            expressions.push(expression);
         });
      });
   }

   /**
    * Process attributes keeping the nodes order
    * @deprecated
    * @param node
    * @param context
    * @param expressions
    */
   private processComponentAttributes(node: Ast.BaseWasabyElement, context: IContext, expressions: Ast.ExpressionNode[]) {
      const chain = [];
      for (const name in node.__$ws_attributes) {
         const attribute = node.__$ws_attributes[name];
         chain.splice(attribute.__$ws_key, 0, attribute);
      }
      for (const name in node.__$ws_events) {
         const event = node.__$ws_events[name];
         chain.splice(event.__$ws_key, 0, event);
      }
      for (const name in node.__$ws_options) {
         const option = node.__$ws_options[name];
         if (!option.hasFlag(Ast.Flags.UNPACKED)) {
            continue;
         }
         chain.splice(option.__$ws_key, 0, option);
      }
      chain.forEach((node: Ast.Ast) => {
         node.accept(this, context).forEach((expression: Ast.ExpressionNode) => {
            expressions.push(expression);
         });
      });
   }

   /**
    * Process injected data keeping the nodes order
    * @deprecated
    * @param node
    * @param context
    * @param expressions
    */
   private processInjectedData(node: Ast.BaseWasabyElement, context: IContext, expressions: Ast.ExpressionNode[]): void {
      const injectedData: Ast.Ast[] = [];
      for (const name in node.__$ws_options) {
         const option = node.__$ws_options[name];
         if (option.hasFlag(Ast.Flags.UNPACKED)) {
            continue;
         }
         injectedData.splice(option.__$ws_key, 0, option);
      }
      for (const name in node.__$ws_contents) {
         const content = node.__$ws_contents[name];
         if (content.hasFlag(Ast.Flags.NEST_CASTED)) {
            content.__$ws_content.forEach((node: Ast.Ast) => {
               node.accept(this, context).forEach((expression: Ast.ExpressionNode) => {
                  expressions.push(expression);
               });
            });
            return;
         }
         injectedData.splice(content.__$ws_key, 0, content);
      }
      injectedData.forEach((node: Ast.Ast) => {
         node.accept(this, context).forEach((expression: Ast.ExpressionNode) => {
            expressions.push(expression);
         });
      })
   }
}

export default function annotate(nodes: Ast.Ast[]): IAnnotatedTree {
   return new AnnotateProcessor()
      .annotate(nodes);
}
