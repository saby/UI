/// <amd-module name="UI/_builder/Tmpl/html/Parser" />

/**
 * @author Крылов М.А.
 */

import { ITreeBuilderOptions, TreeBuilder } from './TreeBuilder';
import { createSource } from './Source';
import createWhiteSpaceVisitor from './WhiteSpaceVisitor';
import { PatchVisitor } from './PatchVisitor';
import { Node } from './Nodes';

/**
 *
 */
export interface IParserOptions extends ITreeBuilderOptions {

   /**
    *
    */
   cleanWhiteSpaces: boolean;

   /**
    *
    */
   normalizeLineFeed: boolean;

   /**
    *
    */
   compatibleTreeStructure: boolean;

   /**
    *
    */
   rudeWhiteSpaceCleaning: boolean;

   /**
    *
    */
   needPreprocess: boolean;
}

/**
 *
 * @param text {string}
 * @param path {string}
 * @param options {IParserOptions}
 */
export function parse(text: string, path: string, options: IParserOptions): Node[] {
   const source = createSource(text, path, options.normalizeLineFeed);
   const builder = new TreeBuilder(options);
   let tree = builder.build(source);
   if (options.cleanWhiteSpaces) {
      const whitespaceVisitor = createWhiteSpaceVisitor(options.rudeWhiteSpaceCleaning, options.needPreprocess);
      tree = whitespaceVisitor.visitAll(tree);
   }
   if (options.compatibleTreeStructure) {
      const patchVisitor = new PatchVisitor();
      tree = patchVisitor.visitAll(tree);
   }
   return tree;
}
