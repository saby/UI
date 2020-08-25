/// <amd-module name="UI/_builder/Tmpl/core/PatchVisitor" />

/**
 * @author Крылов М.А.
 *
 * Данный посетитель выполняет плохой патч дерева wasaby
 * для поддержания совместимости между wasaby-парсерами.
 * Удалить после реализации остальных фаз анализа и синтеза.
 */

import * as Ast from './Ast';

class PatchVisitor implements Ast.IAstVisitor {
   visitAttribute(node: Ast.AttributeNode, context: any): any {
      return node;
   }

   visitOption(node: Ast.OptionNode, context: any): any {
      return node;
   }

   visitBind(node: Ast.BindNode, context: any): any {
      return node;
   }

   visitEvent(node: Ast.EventNode, context: any): any {
      return node;
   }

   visitElement(node: Ast.ElementNode, context: any): any {
      return node;
   }

   visitDoctype(node: Ast.DoctypeNode, context: any): any {
      return node;
   }

   visitCData(node: Ast.CDataNode, context: any): any {
      return node;
   }

   visitInstruction(node: Ast.InstructionNode, context: any): any {
      return node;
   }

   visitComment(node: Ast.CommentNode, context: any): any {
      return node;
   }

   visitComponent(node: Ast.ComponentNode, context: any): any {
      return node;
   }

   visitPartial(node: Ast.PartialNode, context: any): any {
      return node;
   }

   visitTemplate(node: Ast.TemplateNode, context: any): any {
      return node;
   }

   visitIf(node: Ast.IfNode, context: any): any {
      return node;
   }

   visitElse(node: Ast.ElseNode, context: any): any {
      return node;
   }

   visitFor(node: Ast.ForNode, context: any): any {
      return node;
   }

   visitForeach(node: Ast.ForeachNode, context: any): any {
      return node;
   }

   visitArray(node: Ast.ArrayNode, context: any): any {
      return node;
   }

   visitBoolean(node: Ast.BooleanNode, context: any): any {
      return node;
   }

   visitFunction(node: Ast.FunctionNode, context: any): any {
      return node;
   }

   visitNumber(node: Ast.NumberNode, context: any): any {
      return node;
   }

   visitObject(node: Ast.ObjectNode, context: any): any {
      return node;
   }

   visitString(node: Ast.StringNode, context: any): any {
      return node;
   }

   visitValue(node: Ast.ValueNode, context: any): any {
      return node;
   }

   visitText(node: Ast.TextNode, context: any): any {
      return node;
   }

   visitTextData(node: Ast.TextDataNode, context: any): any {
      return node;
   }

   visitExpression(node: Ast.ExpressionNode, context: any): any {
      return node;
   }

   visitTranslation(node: Ast.TranslationNode, context: any): any {
      return node;
   }
}

export default function patch(nodes: Ast.Ast[]): Ast.Ast[] {
   const visitor = new PatchVisitor();
   const context = { };
   return nodes.map(
      (node: Ast.Ast) => node.accept(visitor, context)
   );
}
