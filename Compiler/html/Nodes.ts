// tslint:disable:max-classes-per-file

/**
 * @author Крылов М.А.
 */

import { SourcePosition } from './Reader';

/**
 * Interface that declares methods to visit nodes in the tree.
 */
export interface INodeVisitor {

   /**
    * Visit text node.
    * @param node {Comment} Text node.
    * @param context {*} Context.
    */
   visitText(node: Text, context?: any): any;

   /**
    * Visit comment node.
    * @param node {Comment} Comment node.
    * @param context {*} Context.
    */
   visitComment(node: Comment, context?: any): any;

   /**
    * Visit CDATA section node.
    * @param node {CData} CDATA section node.
    * @param context {*} Context.
    */
   visitCData(node: CData, context?: any): any;

   /**
    * Visit doctype node.
    * @param node {Doctype} Doctype node.
    * @param context {*} Context.
    */
   visitDoctype(node: Doctype, context?: any): any;

   /**
    * Visit instruction node.
    * @param node {Instruction} Instruction node.
    * @param context {*} Context.
    */
   visitInstruction(node: Instruction, context?: any): any;

   /**
    * Visit tag node.
    * @param node {Tag} Tag node.
    * @param context {*} Context.
    */
   visitTag(node: Tag, context?: any): any;

   /**
    * Visit all nodes in collection.
    * @param nodes {Node[]} Nodes collection.
    * @param context {*} Context.
    */
   visitAll(nodes: Node[], context?: any): any;
}

/**
 * Abstract class for all nodes.
 */
export abstract class Node {

   /**
    * Start position in source.
    */
   readonly position: SourcePosition;

   /**
    * Initialize instance with source position.
    * @param position {SourcePosition} Start position in source.
    */
   protected constructor(position: SourcePosition) {
      this.position = position;
   }

   /**
    * Accept visitor.
    * @param visitor {INodeVisitor} Concrete visitor.
    * @param context {*} Context.
    */
   abstract accept(visitor: INodeVisitor, context?: any): any;
}

/**
 * Represents text node.
 */
export class Text extends Node {

   /**
    * Text content.
    */
   data: string;

   /**
    *
    * @param data {string}
    * @param position {SourcePosition}
    */
   constructor(data: string, position: SourcePosition) {
      super(position);
      this.data = data;
   }

   /**
    * Accept visitor.
    * @param visitor {INodeVisitor} Concrete visitor.
    * @param context {*} Context.
    */
   accept(visitor: INodeVisitor, context?: any): any {
      return visitor.visitText(this, context);
   }
}

/**
 *
 */
export class Comment extends Node {

   /**
    *
    */
   data: string;

   /**
    *
    * @param data {string}
    * @param position {SourcePosition}
    */
   constructor(data: string, position: SourcePosition) {
      super(position);
      this.data = data;
   }

   /**
    * Accept visitor.
    * @param visitor {INodeVisitor} Concrete visitor.
    * @param context {*} Context.
    */
   accept(visitor: INodeVisitor, context?: any): any {
      return visitor.visitComment(this, context);
   }
}

/**
 *
 */
export class CData extends Node {

   /**
    *
    */
   data: string;

   /**
    *
    * @param data {string}
    * @param position {SourcePosition}
    */
   constructor(data: string, position: SourcePosition) {
      super(position);
      this.data = data;
   }

   /**
    * Accept visitor.
    * @param visitor {INodeVisitor} Concrete visitor.
    * @param context {*} Context.
    */
   accept(visitor: INodeVisitor, context?: any): any {
      return visitor.visitCData(this, context);
   }
}

/**
 *
 */
export class Doctype extends Node {

   /**
    *
    */
   data: string;

   /**
    *
    * @param data {string}
    * @param position {SourcePosition}
    */
   constructor(data: string, position: SourcePosition) {
      super(position);
      this.data = data;
   }

   /**
    * Accept visitor.
    * @param visitor {INodeVisitor} Concrete visitor.
    * @param context {*} Context.
    */
   accept(visitor: INodeVisitor, context?: any): any {
      return visitor.visitDoctype(this, context);
   }
}

/**
 *
 */
export class Instruction extends Node {

   /**
    *
    */
   data: string;

   /**
    *
    * @param data {string}
    * @param position {SourcePosition}
    */
   constructor(data: string, position: SourcePosition) {
      super(position);
      this.data = data;
   }

   /**
    * Accept visitor.
    * @param visitor {INodeVisitor} Concrete visitor.
    * @param context {*} Context.
    */
   accept(visitor: INodeVisitor, context?: any): any {
      return visitor.visitInstruction(this, context);
   }
}

/**
 *
 */
export class Attribute {

   /**
    *
    */
   readonly position: SourcePosition;

   /**
    *
    */
   readonly name: string;

   /**
    *
    */
   value: string | null = null;

   /**
    *
    * @param name {string}
    * @param position {SourcePosition}
    */
   constructor(name: string, position: SourcePosition) {
      this.name = name;
      this.position = position;
   }
}

/**
 *
 */
export interface IAttributes {

   /**
    *
    */
   [name: string]: Attribute;
}

/**
 *
 */
export class Tag extends Node {

   /**
    *
    */
   name: string;

   /**
    *
    */
   attributes: IAttributes;

   /**
    *
    */
   children: Node[] = [];

   /**
    *
    */
   isSelfClosing: boolean = false;

   /**
    *
    */
   isVoid: boolean = false;

   /**
    *
    * @param name {string}
    * @param attributes {IAttributes}
    * @param position {SourcePosition}
    */
   constructor(name: string, attributes: IAttributes, position: SourcePosition) {
      super(position);
      this.name = name;
      this.attributes = attributes;
   }

   /**
    * Accept visitor.
    * @param visitor {INodeVisitor} Concrete visitor.
    * @param context {*} Context.
    */
   accept(visitor: INodeVisitor, context?: any): any {
      return visitor.visitTag(this, context);
   }
}
