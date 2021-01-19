/**
 * @author Крылов М.А.
 */

import { ITokenHandler, ITokenizer, Tokenizer, ITokenizerOptions } from './Tokenizer';
import { ISource } from './Source';
import { CData, Comment, Doctype, Instruction, Tag, Text, Node, IAttributes } from './Nodes';
import { ITagDescription } from './Tags';
import { ContentModel } from './ContentModel';
import { SourcePosition } from './Reader';
import { IErrorHandler } from '../utils/ErrorHandler';

/**
 *
 */
declare type TTagDescriptor = (name: string) => ITagDescription;

/**
 *
 */
export interface ITreeBuilderOptions extends ITokenizerOptions {

   /**
    *
    */
   tagDescriptor: TTagDescriptor;
}

/**
 *
 */
export interface ITreeBuilder extends ITokenHandler {

   /**
    *
    * @param source
    */
   build(source: ISource): Node[];
}

/**
 *
 */
export class TreeBuilder implements ITreeBuilder {

   /**
    *
    */
   private readonly tokenizer: ITokenizer;

   /**
    *
    */
   private readonly errorHandler: IErrorHandler;

   /**
    *
    */
   private readonly tagDescriptor: TTagDescriptor;

   /**
    *
    */
   private tree: Node[] = [];

   /**
    *
    */
   private stack: Tag[] = [];

   /**
    *
    */
   private dataNode: Text | Comment | null = null;

   /**
    *
    */
   private fileName: string = '[[unknown]]';

   /**
    *
    * @param options {ITreeBuilderOptions}
    */
   constructor(options: ITreeBuilderOptions) {
      this.tokenizer = new Tokenizer(this, options);
      this.errorHandler = options.errorHandler;
      this.tagDescriptor = options.tagDescriptor;
   }

   /**
    *
    * @param source {ISource}
    */
   build(source: ISource): Node[] {
      this.fileName = source.getPath();
      this.tokenizer.tokenize(source);
      return this.tree;
   }

   /**
    *
    * @param name {string}
    * @param attributes {IAttributes}
    * @param selfClosing {boolean}
    * @param position {SourcePosition}
    */
   onOpenTag(name: string, attributes: IAttributes, selfClosing: boolean, position: SourcePosition): void {
      this.cleanDataNode();
      const description = this.tagDescriptor(name);
      if (selfClosing) {
         if (!(description.allowSelfClosing || description.isVoid)) {
            this.errorHandler.error(`Тег "${name}" не может быть самозакрывающимся или пустым`, {
               position,
               fileName: this.fileName
            });
         }
      }
      const node = new Tag(name, attributes, position);
      node.isSelfClosing = selfClosing;
      node.isVoid = description.isVoid;
      // FIXME: уточнить этот момент
      // if (this.stack.length > 0) {
      //    const parentName = this.stack[this.stack.length - 1].name;
      //    if (this.tagDescriptor(parentName).closedByChildren.indexOf(name) !== -1) {
      //       this.stack.pop();
      //    }
      // }
      this.appendNode(node);
      if ((!selfClosing && !description.isVoid)) {
         this.stack.push(node);
         if (description.contentModel !== ContentModel.PARSABLE_DATA) {
            this.tokenizer.setContentModel(description.contentModel, name);
         }
      }
   }

   /**
    *
    * @param name {string}
    * @param position {SourcePosition}
    */
   onCloseTag(name: string, position: SourcePosition): void {
      this.cleanDataNode();
      const description = this.tagDescriptor(name);
      if (description.isVoid) {
         this.errorHandler.error(`Обнаружен закрывающий тег "${name}", который является пустым (void)`, {
            position,
            fileName: this.fileName
         });
      }
      this.popNode(name, position);
   }

   /**
    *
    * @param data {string}
    * @param position {SourcePosition}
    */
   onText(data: string, position: SourcePosition): void {
      if (this.dataNode instanceof Text) {
         this.dataNode.data += data;
         return;
      }
      const node = new Text(data, position);
      this.appendNode(node);
      this.dataNode = node;
   }

   /**
    *
    * @param data {string}
    * @param position {SourcePosition}
    */
   onComment(data: string, position: SourcePosition): void {
      if (this.dataNode instanceof Comment) {
         this.dataNode.data += data;
         return;
      }
      const node = new Comment(data, position);
      this.appendNode(node);
      this.dataNode = node;
   }

   /**
    *
    * @param data {string}
    * @param position {SourcePosition}
    */
   onCDATA(data: string, position: SourcePosition): void {
      this.cleanDataNode();
      this.appendNode(new CData(data, position));
   }

   /**
    *
    * @param data {string}
    * @param position {SourcePosition}
    */
   onDoctype(data: string, position: SourcePosition): void {
      this.cleanDataNode();
      this.appendNode(new Doctype(data, position));
   }

   /**
    *
    * @param data {string}
    * @param position {SourcePosition}
    */
   onInstruction(data: string, position: SourcePosition): void {
      this.cleanDataNode();
      this.appendNode(new Instruction(data, position));
   }

   /**
    *
    * @param position {SourcePosition}
    */
   onEOF(position: SourcePosition): void {
      this.cleanDataNode();
      this.flushStack(position);
   }

   /**
    *
    */
   private cleanDataNode(): void {
      this.dataNode = null;
   }

   /**
    *
    * @param node {Node}
    */
   private appendNode(node: Node): void {
      const parent = this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
      const siblings = parent ? parent.children : this.tree;
      siblings.push(node);
      this.dataNode = undefined;
   }

   /**
    *
    * @param name {string}
    * @param position {SourcePosition}
    */
   private popNode(name: string, position: SourcePosition): void {
      for (let index = this.stack.length - 1; index >= 0; --index) {
         const node = this.stack[index];
         const currentNodeName = (node as Tag).name;
         if (currentNodeName === name) {
            this.stack.splice(index, this.stack.length - index);
            return;
         }
         if (!this.tagDescriptor(currentNodeName).closedByParent) {
            this.errorHandler.critical(`Обнаружен закрывающий тег "${name}", для которого не был указан открывающий тег`, {
               position,
               fileName: this.fileName
            });
            return;
         }
      }
      this.errorHandler.critical(`Обнаружен закрывающий тег "${name}", для которого не был указан открывающий тег`, {
         position,
         fileName: this.fileName
      });
   }

   /**
    *
    * @param position {SourcePosition}
    */
   private flushStack(position: SourcePosition): void {
      for (let index = this.stack.length - 1; index >= 0; --index) {
         const node = this.stack[index];
         if (!this.tagDescriptor(node.name).closedByParent) {
            this.errorHandler.critical(`Обнаружен незакрытый тег "${node.name}"`, {
               position,
               fileName: this.fileName
            });
         }
      }
   }
}
