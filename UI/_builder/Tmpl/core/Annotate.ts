/// <amd-module name="UI/_builder/Tmpl/core/Annotate" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Annotate.ts
 */

import * as Ast from 'UI/_builder/Tmpl/core/Ast';

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

class AnnotateProcessor implements Ast.IAstVisitor, IAnnotateProcessor {

   annotate(nodes: Ast.Ast[]): IAnnotatedTree {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   // <editor-fold desc="Data types">

   visitArray(node: Ast.ArrayNode, context: IContext): Ast.ExpressionNode[] {
      let expressions = [];
      node.__$ws_elements.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   visitBoolean(node: Ast.BooleanNode, context: IContext): Ast.ExpressionNode[] {
      let expressions = [];
      node.__$ws_data.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   visitFunction(node: Ast.FunctionNode, context: IContext): Ast.ExpressionNode[] {
      let expressions = [];
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
      let expressions = [];
      node.__$ws_data.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   visitObject(node: Ast.ObjectNode, context: IContext): Ast.ExpressionNode[] {
      let expressions = [];
      for (const name in node.__$ws_properties) {
         const property = node.__$ws_properties[name];
         expressions = expressions.concat(property.accept(this, context));
      }
      return expressions;
   }

   visitString(node: Ast.StringNode, context: IContext): Ast.ExpressionNode[] {
      let expressions = [];
      node.__$ws_data.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   visitValue(node: Ast.ValueNode, context: IContext): Ast.ExpressionNode[] {
      let expressions = [];
      node.__$ws_data.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   // </editor-fold>

   // <editor-fold desc="Attributes and options">

   visitAttribute(node: Ast.AttributeNode, context: IContext): Ast.ExpressionNode[] {
      let expressions = [];
      node.__$ws_value.forEach((node: Ast.Ast) => {
         expressions = expressions.concat(node.accept(this, context));
      });
      return expressions;
   }

   visitBind(node: Ast.BindNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitEvent(node: Ast.EventNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
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
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitDoctype(node: Ast.DoctypeNode, context: IContext): Ast.ExpressionNode[] {
      return EMPTY_ARRAY;
   }

   visitElement(node: Ast.ElementNode, context: IContext): Ast.ExpressionNode[] {
      // TODO: Release
      throw new Error('Not implemented yet');
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
}

export default function annotate(nodes: Ast.Ast[]): IAnnotatedTree {
   return new AnnotateProcessor()
      .annotate(nodes);
}
