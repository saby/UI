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
   // done.
   visitDoctype(node: Ast.DoctypeNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '!DOCTYPE';
      // @ts-ignore
      node.data = node.__$ws_data;
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   // done.
   visitCData(node: Ast.CDataNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '![CDATA[';
      // @ts-ignore
      node.data = node.__$ws_data;
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   // done.
   visitInstruction(node: Ast.InstructionNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '?';
      // @ts-ignore
      node.data = node.__$ws_data;
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   // done.
   visitComment(node: Ast.CommentNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'comment';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   // done.
   visitFor(node: Ast.ForNode, context: INavigationContext): any {
      // @ts-ignore
      node.name = 'ws:for';
      // @ts-ignore
      node.originName = 'ws:for';
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.attribs = {
         CUSTOM_CONDITION: {
            data: node.__$ws_test ? [{
               isBind: false,
               isEvent: false,
               localized: false,
               name: node.__$ws_test,
               noEscape: false,
               type: 'var',
               value: ''
            }] : {
               type: 'text',
               value: ''
            },
            key: undefined,
            type: 'text'
         },
         CUSTOM_ITERATOR: {
            data: node.__$ws_update ? [{
               isBind: false,
               isEvent: false,
               localized: false,
               name: node.__$ws_update,
               noEscape: false,
               type: 'var',
               value: ''
            }] : {
               type: 'text',
               value: ''
            },
            key: undefined,
            type: 'text'
         },
         START_FROM: {
            data: node.__$ws_init ? [{
               isBind: false,
               isEvent: false,
               localized: false,
               name: node.__$ws_init,
               noEscape: false,
               type: 'var',
               value: ''
            }] : {
               type: 'text',
               value: ''
            },
            key: undefined,
            type: 'text'
         },
      };
      // @ts-ignore
      node.children = node.__$ws_content;
      this.visitAll(node.__$ws_content, context);
   }

   // done.
   visitForeach(node: Ast.ForeachNode, context: INavigationContext): any {
      // @ts-ignore
      node.name = 'ws:for';
      // @ts-ignore
      node.originName = 'ws:for';
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.attribs = { };
      // @ts-ignore
      node.forSource = {
         key: node.__$ws_index,
         value: node.__$ws_iterator,
         main: node.__$ws_collection
      };
      // @ts-ignore
      node.children = node.__$ws_content;
      this.visitAll(node.__$ws_content, context);
   }

   // done.
   visitText(node: Ast.TextNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'text';
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.data = node.__$ws_content;
      const textContext = {
         isBind: false,
         isEvent: false,
         localized: false,
         noEscape: false,
         ...(context || { })
      };
      // @ts-ignore
      this.visitAll(node.__$ws_content, textContext);
   }

   // done.
   visitTextData(node: Ast.TextDataNode, context: INavigationContext): any {
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.type = 'text';
      // @ts-ignore
      node.value = node.__$ws_content;
   }

   // done.
   visitExpression(node: Ast.ExpressionNode, context: INavigationContext): any {
      // @ts-ignore
      node.isBind = !!context.isBind;
      // @ts-ignore
      node.isEvent = !!context.isEvent;
      // @ts-ignore
      node.localized = !!context.localized;
      // @ts-ignore
      node.noEscape = !!context.noEscape;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = node.__$ws_program;
      // @ts-ignore
      node.value = '';
      // @ts-ignore
      node.type = 'var';
   }

   // done.
   visitTranslation(node: Ast.TranslationNode, context: INavigationContext): any {
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.localized = true;
      // @ts-ignore
      node.name = `${node.__$ws_context} @@ ${node.__$ws_text}`;
      // @ts-ignore
      node.type = 'var';
      // @ts-ignore
      node.value = undefined;
   }

   // done.
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

   // done.
   visitTemplate(node: Ast.TemplateNode, context: INavigationContext): any {
      // @ts-ignore
      node.attribs = {
         name: node.__$ws_name
      };
      // @ts-ignore
      node.children = node.__$ws_content;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.name = 'ws:template';
      // @ts-ignore
      node.originName = 'ws:template';
      // @ts-ignore
      node.type = 'tag';
   }

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
      node.type = getTagType(node.__$ws_name);
      // @ts-ignore
      node.name = node.__$ws_name;
      // @ts-ignore
      node.originName = node.__$ws_name;
      // @ts-ignore
      node.key = node.__$ws_key;
      // @ts-ignore
      node.children = node.__$ws_content;
      // @ts-ignore
      node.attribs = { };
      this.visitAll(node.__$ws_content, context);
   }

   visitComponent(node: Ast.ComponentNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   visitPartial(node: Ast.PartialNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   visitIf(node: Ast.IfNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   visitElse(node: Ast.ElseNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   visitArray(node: Ast.ArrayNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   visitBoolean(node: Ast.BooleanNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   visitFunction(node: Ast.FunctionNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   visitNumber(node: Ast.NumberNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   visitObject(node: Ast.ObjectNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   visitString(node: Ast.StringNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = 'tag';
      // @ts-ignore
      node.key = node.__$ws_key;
   }

   visitValue(node: Ast.ValueNode, context: INavigationContext): any {
      // @ts-ignore
      node.type = getTagType(node.name);
      // @ts-ignore
      node.key = node.__$ws_key;
   }
}

export default function patch(nodes: Ast.Ast[]): Ast.Ast[] {
   const visitor = new PatchVisitor();
   const context = { };
   return nodes.map(
      (node: Ast.Ast) => node.accept(visitor, context)
   );
}
