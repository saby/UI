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
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.CDataNode(node.data);
         default:
            return undefined;
      }
   }

   visitComment(node: Nodes.Comment, context?: any): Ast.CommentNode {
      return new Ast.CommentNode(node.data);
   }

   visitDoctype(node: Nodes.Doctype, context?: any): Ast.DoctypeNode {
      const state = this.getCurrentState();
      switch (state) {
         case TraverseState.MARKUP:
         case TraverseState.COMPONENT:
         case TraverseState.COMPONENT_OPTION:
            return new Ast.DoctypeNode(node.data);
         default:
            return undefined;
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
            return undefined;
      }
   }

   visitTag(node: Nodes.Tag, context?: any): Ast.Ast {
      throw new Error('Not implemented');
   }

   visitText(node: Nodes.Text, context?: any): Ast.Ast {
      throw new Error('Not implemented');
   }

   transform(nodes: Nodes.Node[], context?: any): Ast.Ast[] {
      this.stateStack.push(TraverseState.MARKUP);
      return this.visitAll(nodes, context);
   }

   private getCurrentState(): TraverseState {
      return this.stateStack[this.stateStack.length - 1];
   }
}
