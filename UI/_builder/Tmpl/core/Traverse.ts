/// <amd-module name="UI/_builder/Tmpl/core/Traverse" />

/**
 * @author Крылов М.А.
 */

import * as Nodes from 'UI/_builder/Tmpl/html/Nodes';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import * as Names from 'UI/_builder/Tmpl/core/Names';
import { isElementNode } from 'UI/_builder/Tmpl/core/Html';

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
            return this.processTagInMarkup(node, context);
         case TraverseState.COMPONENT_OPTION:
            return this.processTagInComponentOption(node, context);
         case TraverseState.ARRAY_DATA:
            return this.processTagInArrayData(node, context);
         case TraverseState.PRIMITIVE_DATA:
            return this.processTagInPrimitiveData(node, context);
         case TraverseState.OBJECT_DATA:
            return this.processTagInObjectData(node, context);
         default:
            throw new Error('Unknown state');
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

   private processTagInMarkup(node: Nodes.Tag, context?: any): any {
      const strictMarkup = this.getCurrentState() === TraverseState.MARKUP;
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               if (strictMarkup) {
                  throw new Error('Unexpected ws-prefixed node in markup');
               }
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }

   private processTagInComponentOption(node: Nodes.Tag, context?: any): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }

   private processTagInArrayData(node: Nodes.Tag, context?: any): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }

   private processTagInPrimitiveData(node: Nodes.Tag, context?: any): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }

   private processTagInObjectData(node: Nodes.Tag, context?: any): any {
      switch (node.name) {
         case 'ws:if':
         case 'ws:else':
         case 'ws:for':
         case 'ws:template':
         case 'ws:partial':
         case 'ws:Array':
         case 'ws:Boolean':
         case 'ws:Function':
         case 'ws:Number':
         case 'ws:Object':
         case 'ws:String':
         case 'ws:Value':
         default:
            if (Names.isComponentOptionName(node.name)) {
               // ws:*
               throw new Error('Not implemented');
            }
            if (Names.isComponentName(node.name)) {
               throw new Error('Not implemented');
            }
            if (isElementNode(node.name)) {
               throw new Error('Not implemented');
            }
            // unknown node
            throw new Error('Unknown node');
      }
   }
}

export default function traverse(nodes: Nodes.Node[]) {
   return new Traverse().transform(
      nodes
   );
}
