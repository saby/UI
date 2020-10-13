/// <amd-module name="UI/_builder/Tmpl/core/Annotate" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Annotate.ts
 */

import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import { ProgramNode } from 'UI/_builder/Tmpl/expressions/_private/Nodes';

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

const EMPTY_ARRAY = [];

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

function appendInternalExpressions(internal: Ast.IInternal, expressions: Ast.ExpressionNode[]): void {
   // TODO: Release
   throw new Error('Not implemented yet');
}

function wrestNonIgnoredIdentifiers(expressions: Ast.ExpressionNode[], ignoredIdentifiers: IStorage): Ast.ExpressionNode[] {
   // TODO: Release
   throw new Error('Not implemented yet');
}

function excludeIgnoredExpressions(expressions: Ast.ExpressionNode[], ignoredIdentifiers: IStorage): Ast.ExpressionNode[] {
   // TODO: Release
   throw new Error('Not implemented yet');
}

function collectIdentifiers(program: ProgramNode): string[] {
   // TODO: Release
   throw new Error('Not implemented yet');
}

function collectDroppedExpressions(program: ProgramNode): ProgramNode[] {
   // TODO: Release
   throw new Error('Not implemented yet');
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

class AnnotateProcessor implements Ast.IAstVisitor, IAnnotateProcessor {

   annotate(nodes: Ast.Ast[]): IAnnotatedTree {
      // TODO: Release
      throw new Error('Not implemented yet');
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
      // TODO: Process node.__$ws_unpackedCycle
      return this.processElement(node, context);
   }

   visitInstruction(node: Ast.InstructionNode, context: IContext): Ast.ExpressionNode[] {
      return EMPTY_ARRAY;
   }

   // </editor-fold>

   // <editor-fold desc="Directives">

   visitElse(node: Ast.ElseNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitFor(node: Ast.ForNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitForeach(node: Ast.ForeachNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitIf(node: Ast.IfNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitTemplate(node: Ast.TemplateNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   // </editor-fold>

   // <editor-fold desc="Extended text">

   visitExpression(node: Ast.ExpressionNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitText(node: Ast.TextNode, context: IContext): Ast.ExpressionNode[] {
      return EMPTY_ARRAY;
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
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitDynamicPartial(node: Ast.DynamicPartialNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitStaticPartial(node: Ast.StaticPartialNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
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
      this.annotateEnumerable(node.__$ws_attributes, context, expressions);
      this.annotateEnumerable(node.__$ws_events, context, expressions);
      return expressions;
   }

   private annotateEnumerable(collection: Ast.IAttributes | Ast.IEvents | Ast.IOptions | Ast.IObjectProperties, context: IContext, expressions: Ast.ExpressionNode[]): void {
      for (const name in collection) {
         const item = collection[name];
         expressions.push(
            item.accept(this, context)
         );
      }
   }
}

export default function annotate(nodes: Ast.Ast[]): IAnnotatedTree {
   return new AnnotateProcessor()
      .annotate(nodes);
}
