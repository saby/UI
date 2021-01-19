/**
 * @author Крылов М.А.
 *
 * Данный посетитель выполняет плохой патч дерева html
 * для поддержания совместимости между html-парсерами.
 * Удалить после реализации остальных фаз анализа и синтеза.
 */

// tslint:disable

import { INodeVisitor, CData, Comment, Doctype, Instruction, Tag, Text, Node } from './Nodes';

interface INavigationContext {
   parent: Node | null;
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

export class PatchVisitor implements INodeVisitor {
   visitText(node: Text, context: INavigationContext): void {
      // @ts-ignore
      node.type = 'text';
   }

   visitComment(node: Comment, context: INavigationContext): void {
      // @ts-ignore
      node.type = 'comment';
   }

   visitCData(node: CData, context: INavigationContext): void {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '![CDATA[';
      // @ts-ignore
      node.data = `![CDATA[${node.data}]]`;
   }

   visitDoctype(node: Doctype, context: INavigationContext): void {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '!DOCTYPE';
      // @ts-ignore
      node.data = `!DOCTYPE ${node.data}`;
   }

   visitInstruction(node: Instruction, context: INavigationContext): void {
      // @ts-ignore
      node.type = 'directive';
      // @ts-ignore
      node.name = '?';
   }

   visitTag(node: Tag, context: INavigationContext): void {
      // @ts-ignore
      node.type = getTagType(node.name);
      // @ts-ignore
      node.attribs = { };
      for (const attribute in node.attributes) {
         // @ts-ignore
         node.attribs[attribute] = node.attributes[attribute].value;
      }
      this.visitAll(node.children, {
         parent: node
      });
   }

   visitAll(nodes: Node[], context?: INavigationContext): Node[] {
      for (let i = 0; i < nodes.length; ++i) {
         nodes[i].accept(this);
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
