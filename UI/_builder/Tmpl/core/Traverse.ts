/// <amd-module name="UI/_builder/Tmpl/core/Traverse" />

/**
 * @author Крылов М.А.
 */

import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';

class Traverse implements Nodes.INodeVisitor {
   visitAll(nodes: Nodes.Node[], context?: any): Ast.Ast[] {
      const children: Ast.Ast[] = [];
      for (let i = 0; i < nodes.length; ++i) {
         const child = <Ast.Ast>nodes[i].accept(this);
         if (child) {
            children.push(child);
         }
      }
      return children;
   }

   visitCData(node: Nodes.CData, context?: any): Ast.CDataNode {
      return new Ast.CDataNode();
   }

   visitComment(node: Nodes.Comment, context?: any): Ast.CommentNode {
      return new Ast.CommentNode();
   }

   visitDoctype(node: Nodes.Doctype, context?: any): Ast.DoctypeNode {
      return new Ast.DoctypeNode();
   }

   visitInstruction(node: Nodes.Instruction, context?: any): Ast.InstructionNode {
      return new Ast.InstructionNode();
   }

   visitTag(node: Nodes.Tag, context?: any): Ast.Ast {
      throw new Error('Not implemented');
   }

   visitText(node: Nodes.Text, context?: any): Ast.Ast {
      throw new Error('Not implemented');
   }
}
