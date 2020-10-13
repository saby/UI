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

interface IContext {
   // TODO: Release
}

class AnnotateProcessor implements Ast.IAstVisitor, IAnnotateProcessor {

   annotate(nodes: Ast.Ast[]): IAnnotatedTree {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   // <editor-fold desc="Data types">

   visitArray(node: Ast.ArrayNode, context: IContext): any {
      node.__$ws_elements.forEach((node: Ast.Ast) => node.accept(this, context));
   }

   visitBoolean(node: Ast.BooleanNode, context: IContext): any {
      node.__$ws_data.forEach((node: Ast.Ast) => node.accept(this, context));
   }

   visitFunction(node: Ast.FunctionNode, context: IContext): any {
      node.__$ws_functionExpression.forEach((node: Ast.Ast) => node.accept(this, context));
      for (const name in node.__$ws_options) {
         const property = node.__$ws_options[name];
         property.accept(this, context);
      }
   }

   visitNumber(node: Ast.NumberNode, context: IContext): any {
      node.__$ws_data.forEach((node: Ast.Ast) => node.accept(this, context));
   }

   visitObject(node: Ast.ObjectNode, context: IContext): any {
      for (const name in node.__$ws_properties) {
         const property = node.__$ws_properties[name];
         property.accept(this, context);
      }
   }

   visitString(node: Ast.StringNode, context: IContext): any {
      node.__$ws_data.forEach((node: Ast.Ast) => node.accept(this, context));
   }

   visitValue(node: Ast.ValueNode, context: IContext): any {
      node.__$ws_data.forEach((node: Ast.Ast) => node.accept(this, context));
   }

   // </editor-fold>

   // <editor-fold desc="Attributes and options">

   visitAttribute(node: Ast.AttributeNode, context: IContext): any {
      node.__$ws_value.forEach((node: Ast.Ast) => node.accept(this, context));
   }

   visitBind(node: Ast.BindNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitEvent(node: Ast.EventNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitOption(node: Ast.OptionNode, context: IContext): any {
      node.__$ws_value.accept(this, context);
   }

   // </editor-fold>

   // <editor-fold desc="HTML nodes">

   visitCData(node: Ast.CDataNode, context: IContext): any { }

   visitComment(node: Ast.CommentNode, context: IContext): any { }

   visitContentOption(node: Ast.ContentOptionNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitDoctype(node: Ast.DoctypeNode, context: IContext): any { }

   visitElement(node: Ast.ElementNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitInstruction(node: Ast.InstructionNode, context: IContext): any { }

   // </editor-fold>

   // <editor-fold desc="Directives">

   visitElse(node: Ast.ElseNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitFor(node: Ast.ForNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitForeach(node: Ast.ForeachNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitIf(node: Ast.IfNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitTemplate(node: Ast.TemplateNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   // </editor-fold>

   // <editor-fold desc="Extended text">

   visitExpression(node: Ast.ExpressionNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitText(node: Ast.TextNode, context: IContext): any { }

   visitTextData(node: Ast.TextDataNode, context: IContext): any { }

   visitTranslation(node: Ast.TranslationNode, context: IContext): any { }

   // </editor-fold>

   // <editor-fold desc="Components and templates">

   visitComponent(node: Ast.ComponentNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitDynamicPartial(node: Ast.DynamicPartialNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitInlineTemplate(node: Ast.InlineTemplateNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   visitStaticPartial(node: Ast.StaticPartialNode, context: IContext): any {
      // TODO: Release
      throw new Error('Not implemented yet');
   }

   // </editor-fold>

}

export default function annotate(nodes: Ast.Ast[]): IAnnotatedTree {
   return new AnnotateProcessor()
      .annotate(nodes);
}
