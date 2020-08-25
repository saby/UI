/// <amd-module name="UI/_builder/Tmpl/core/Traverse" />

/**
 * @author Крылов М.А.
 */

import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';

const enum TraverseState {
   MARKUP,
   COMPONENT,
   COMPONENT_OPTION,
   ARRAY_DATA,
   PRIMITIVE_DATA,
   OBJECT_DATA
}

class Traverse implements Nodes.INodeVisitor {
   private stateStack: TraverseState[];

   constructor() {
      this.stateStack = [];
   }

   visitComment(node: Nodes.Comment, context?: any): Ast.CommentNode {
      return new Ast.CommentNode(node.data);
   }

   visitCData(node: Nodes.CData, context?: any): Ast.CDataNode {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.CDataNode(node.data);
         default:
            throw new Error('Unexpected node');
      }
   }

   visitDoctype(node: Nodes.Doctype, context?: any): Ast.DoctypeNode {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.DoctypeNode(node.data);
         default:
            throw new Error('Unexpected node');
      }
   }

   visitInstruction(node: Nodes.Instruction, context?: any): Ast.InstructionNode {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.InstructionNode(node.data);
         default:
            throw new Error('Unexpected node');
      }
   }

   visitTag(node: Nodes.Tag, context?: any): Ast.Ast {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
            throw new Error('Not implemented');
         case TraverseState.COMPONENT_OPTION:
            throw new Error('Not implemented');
         case TraverseState.ARRAY_DATA:
            throw new Error('Not implemented');
         case TraverseState.PRIMITIVE_DATA:
            throw new Error('Not implemented');
         case TraverseState.OBJECT_DATA:
            throw new Error('Not implemented');
         default:
            throw new Error('Not implemented');
      }
   }

   visitText(node: Nodes.Text, context?: any): Ast.Ast {
      throw new Error('Not implemented');
   }

   transform(nodes: Nodes.Node[], context?: any): Ast.Ast[] {
      this.stateStack.push(TraverseState.MARKUP);
      return this.visitAll(nodes, context);
   }

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

   private getCurrentState(): TraverseState {
      return this.stateStack[this.stateStack.length - 1];
   }
}

export default function traverse(nodes: Nodes.Node[]) {
   return new Traverse().transform(
      nodes
   );
}
