/// <amd-module name="UI/_builder/Tmpl/core/PatchVisitor" />

/**
 * @author Крылов М.А.
 *
 * Данный посетитель выполняет плохой патч дерева wasaby
 * для поддержания совместимости между wasaby-парсерами.
 * Удалить после реализации остальных фаз анализа и синтеза.
 */

import * as Ast from './Ast';

interface INavigationContext {
   parent: Ast.Ast | null;
}

function getTagType(name: string): string {
   if (name === 'script') {
      return name;
   }
   if (name === 'style') {
      return name;
   }
   return 'tag';
}

class PatchVisitor implements Ast.IAstVisitor {
   visitAttribute(node: Ast.AttributeNode, context: INavigationContext): any {
      return node;
   }

   visitOption(node: Ast.OptionNode, context: INavigationContext): any {
      return node;
   }

   visitContentOption(node: Ast.ContentOptionNode, context: INavigationContext): any {
      return node;
   }

   visitBind(node: Ast.BindNode, context: INavigationContext): any {
      return node;
   }

   visitEvent(node: Ast.EventNode, context: INavigationContext): any {
      return node;
   }

   visitElement(node: Ast.ElementNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = getTagType(node.name);
   }

   visitDoctype(node: Ast.DoctypeNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '!DOCTYPE';
      // @ts-ignore
      node.data = `!DOCTYPE ${node.__$ws_data}`;
   }

   visitCData(node: Ast.CDataNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '![CDATA[';
      // @ts-ignore
      node.data = `![CDATA[${node.__$ws_data}]]`;
   }

   visitInstruction(node: Ast.InstructionNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '?';
   }

   visitComment(node: Ast.CommentNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'comment';
   }

   visitComponent(node: Ast.ComponentNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitPartial(node: Ast.PartialNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitTemplate(node: Ast.TemplateNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitIf(node: Ast.IfNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitElse(node: Ast.ElseNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitFor(node: Ast.ForNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitForeach(node: Ast.ForeachNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitArray(node: Ast.ArrayNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitBoolean(node: Ast.BooleanNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitFunction(node: Ast.FunctionNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitNumber(node: Ast.NumberNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitObject(node: Ast.ObjectNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitString(node: Ast.StringNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
   }

   visitValue(node: Ast.ValueNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = getTagType(node.name);
   }

   visitText(node: Ast.TextNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'text';
   }

   visitTextData(node: Ast.TextDataNode, context: INavigationContext): any {
      return node;
   }

   visitExpression(node: Ast.ExpressionNode, context: INavigationContext): any {
      return node;
   }

   visitTranslation(node: Ast.TranslationNode, context: INavigationContext): any {
      return node;
   }

   visitAll(nodes: Ast.Ast[], context?: INavigationContext): any {
      for (let i = 0; i < nodes.length; ++i) {
         nodes[i].accept(this, context);
         // @ts-ignore
         nodes[i].prev = nodes[i - 1] || null;
         // @ts-ignore
         nodes[i].next = nodes[i + 1] || null;
         // @ts-ignore
         nodes[i].parent = context && context.parent || null;
      }
      return nodes;
   }
}

export default function patch(nodes: Ast.Ast[]): Ast.Ast[] {
   const visitor = new PatchVisitor();
   const context = { };
   return nodes.map(
      (node: Ast.Ast) => node.accept(visitor, context)
   );
}
