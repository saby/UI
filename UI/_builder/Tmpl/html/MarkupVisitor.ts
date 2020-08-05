/// <amd-module name="UI/_builder/Tmpl/html/MarkupVisitor" />

/**
 * @author Крылов М.А.
 */

import { INodeVisitor, CData, Comment, Doctype, Instruction, Tag, Text, Node, IAttributes } from './Nodes';

/**
 *
 */
export class MarkupVisitor implements INodeVisitor {

   /**
    *
    * @param node
    */
   visitText(node: Text): string {
      return node.data;
   }

   /**
    *
    * @param node
    */
   visitComment(node: Comment): string {
      return `<!--${node.data}-->`;
   }

   /**
    *
    * @param node
    */
   visitCData(node: CData): string {
      return `<![CDATA[${node.data}]]>`;
   }

   /**
    *
    * @param node
    */
   visitDoctype(node: Doctype): string {
      return `<!DOCTYPE ${node.data}>`;
   }

   visitInstruction(node: Instruction): string {
      return `<${node.data}>`;
   }

   /**
    *
    * @param attributes
    */
   visitAttributes(attributes: IAttributes): string {
      let str = '';
      for (const property in attributes) {
         if (attributes.hasOwnProperty(property)) {
            const attribute = attributes[property];
            if (attribute.value) {
               str += ` ${attribute.name}="${attribute.value}"`;
            } else {
               str += ` ${attribute.name}`;
            }
         }
      }
      return str;
   }

   /**
    *
    * @param node
    */
   visitTag(node: Tag): string {
      const attributes = this.visitAttributes(node.attributes);
      if (node.isVoid) {
         return `<${node.name}${attributes}>`;
      }
      if (node.isSelfClosing) {
         return `<${node.name}${attributes} />`;
      }
      return `<${node.name}${attributes}>${this.visitAll(node.children)}</${node.name}>`;
   }

   /**
    *
    * @param nodes
    */
   visitAll(nodes: Node[]): string {
      return nodes.map((child: Node): any => child.accept(this)).join('');
   }
}
