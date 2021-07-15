/**
 * @author Крылов М.А.
 */

import { INodeVisitor, CData, Comment, Doctype, Instruction, Tag, Text, Node } from './Nodes';
import { SPACE } from './Characters';

/**
 *
 */
const RAW_CONTENT_TAGS = [
   'pre',
   'listing',
   'textarea',
   'template',
   'script',
   'style'
];

/**
 *
 * @param text {string}
 */
function hasText(text: string): boolean {
   return /[^\f\n\r\t\v ]/.test(text);
}

/**
 *
 * @param text {string}
 */
function removeUselessWhitespaces(text: string): string {
   return text
      .replace(/[\f\n\r\t\v ]{2,}/g, SPACE);
}

/**
 *
 */
class WhitespaceVisitor implements INodeVisitor {

   /**
    *
    * @param nodes
    */
   visitAll(nodes: Node[]): Node[] {
      const children = [];
      for (let i = 0; i < nodes.length; ++i) {
         const node = nodes[i].accept(this) as Tag;
         if (node) {
            children.push(node);
         }
      }
      return children;
   }

   /**
    *
    * @param node {CData}
    */
   visitCData(node: CData): CData {
      return node;
   }

   /**
    *
    * @param node {Comment}
    */
   visitComment(node: Comment): Comment {
      return node;
   }

   /**
    *
    * @param node {Doctype}
    */
   visitDoctype(node: Doctype): Doctype {
      return node;
   }

   /**
    *
    * @param node {Instruction}
    */
   visitInstruction(node: Instruction): Instruction {
      return node;
   }

   /**
    *
    * @param node {Tag}
    */
   visitTag(node: Tag): Tag {
      if (RAW_CONTENT_TAGS.indexOf(node.name) === -1) {
         node.children = this.visitAll(node.children);
      }
      return node;
   }

   /**
    *
    * @param node {Text}
    */
   visitText(node: Text): Text | null {
      if (hasText(node.data)) {
         return new Text(
            removeUselessWhitespaces(node.data),
            node.position
         );
      }
      return null;
   }
}

/**
 *
 */
const EMPTY_STRING = '';

/**
 *
 */
interface INavigation {

   /**
    *
    */
   prev?: Node | null;

   /**
    *
    */
   next?: Node | null;

   /**
    *
    */
   parent?: Node | null;
}

/**
 * Специальный посетитель для удаления пробельных символов.
 * Эквивалент регулярных выражений:
 * + .replace(/>[\s]*[\n\r][\s]* /ig, '>')
 * + .replace(/[\s]*[\n\r][\s]*</ig, '<')
 * + .replace(/[\n\r]</ig, '<')
 * + .replace(/>[\n\r]/ig, '>')
 */
class WasabyWhitespaceVisitor implements INodeVisitor {

   /**
    * FIXME: такое выполнялось только для wml.
    *  Если подключить это для tmpl - падают тесты.
    *  Разобраться почему.
    */
   private readonly needPreprocess: boolean;

   /**
    *
    * @param needPreprocess {boolean}
    */
   constructor(needPreprocess: boolean = false) {
      this.needPreprocess = needPreprocess;
   }

   /**
    *
    * @param nodes
    * @param context {INavigation}
    */
   visitAll(nodes: Node[], context?: INavigation): Node[] {
      const children = [];
      const parent = context ? context.parent : null;
      for (let i = 0; i < nodes.length; ++i) {
         const node = nodes[i].accept(this, {
            prev: nodes[i - 1] || null,
            next: nodes[i + 1] || null,
            parent
         } as INavigation) as Tag;
         if (node) {
            children.push(node);
         }
      }
      return children;
   }

   /**
    *
    * @param node {CData}
    * @param context {INavigation}
    */
   visitCData(node: CData, context: INavigation): CData {
      return node;
   }

   /**
    *
    * @param node {Comment}
    * @param context {INavigation}
    */
   visitComment(node: Comment, context: INavigation): Comment {
      return node;
   }

   /**
    *
    * @param node {Doctype}
    * @param context {INavigation}
    */
   visitDoctype(node: Doctype, context: INavigation): Doctype {
      return node;
   }

   /**
    *
    * @param node {Instruction}
    * @param context {INavigation}
    */
   visitInstruction(node: Instruction, context: INavigation): Instruction {
      return node;
   }

   /**
    *
    * @param node {Tag}
    * @param context {INavigation}
    */
   visitTag(node: Tag, context: INavigation): Tag {
      node.children = this.visitAll(node.children, {
         parent: node
      });
      return node;
   }

   /**
    *
    * @param node {Text}
    * @param context {INavigation}
    */
   visitText(node: Text, context: INavigation): Text | null {
      let data = node.data;
      if (this.needPreprocess) {
         if (context.prev || context.parent) {
            data = data
               .replace(/^[\s]*[\n\r][\s]*/ig, SPACE)
               .replace(/^[\n\r]/ig, SPACE);
         }
         if (context.next || context.parent) {
            data = data
               .replace(/[\s]*[\n\r][\s]*$/ig, SPACE)
               .replace(/[\n\r]$/ig, SPACE);
         }
      }
      data = data.replace(/\s+/g, SPACE);
      if (data.length > 0 && data !== SPACE) {
         return new Text(
            data,
            node.position
         );
      }
      return null;
   }
}

/**
 *
 * @param rudeWhiteSpaceCleaning {boolean}
 * @param needPreprocess {boolean}
 */
export default function createWhiteSpaceVisitor(
   rudeWhiteSpaceCleaning: boolean,
   needPreprocess: boolean
): INodeVisitor {
   if (rudeWhiteSpaceCleaning) {
      return new WasabyWhitespaceVisitor(needPreprocess);
   }
   return new WhitespaceVisitor();
}
