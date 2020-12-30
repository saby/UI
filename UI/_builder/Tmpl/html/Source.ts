/// <amd-module name="UI/_builder/Tmpl/html/Source" />

/**
 * @author Крылов М.А.
 *
 * @link https://www.w3.org/TR/html51/syntax.html#preprocessing-the-input-stream
 */

import * as Characters from './Characters';

/**
 *
 * @param text {string}
 */
function normalizeNewLines(text: string): string {
   return text
      .replace(/\n\r/g, Characters.LINE_FEED)
      .replace(/\r/g, Characters.LINE_FEED);
}

/**
 *
 */
export interface ISource {

   /**
    *
    */
   getPath(): string;

   /**
    *
    * @param offset {number}
    */
   getChar(offset: number): string;

   /**
    *
    */
   getLength(): number;
}

/**
 *
 */
class Source implements ISource {

   /**
    *
    */
   private readonly content: string;

   /**
    *
    */
   private readonly path: string;

   /**
    *
    * @param content {string}
    * @param path {string}
    */
   constructor(content: string, path: string) {
      this.content = content;
      this.path = path;
   }

   /**
    *
    */
   getPath(): string {
      return this.path;
   }

   /**
    *
    * @param offset {number}
    */
   getChar(offset: number): string {
      return this.content[offset];
   }

   /**
    *
    */
   getLength(): number {
      return this.content.length;
   }
}

/**
 *
 * @param content {string}
 * @param path {string}
 * @param normalizeLineFeed {boolean}
 */
export function createSource(content: string, path: string, normalizeLineFeed: boolean = true): ISource {
   if (normalizeLineFeed) {
      return new Source(normalizeNewLines(content), path);
   }
   return new Source(content, path);
}
