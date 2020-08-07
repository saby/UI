/// <amd-module name="UI/_builder/Tmpl/html/Reader" />

/**
 * @author Крылов М.А.
 */

import { ISource } from './Source';
import * as Characters from './Characters';

/**
 *
 */
export class SourcePosition {

   /**
    *
    */
   readonly offset: number;

   /**
    *
    */
   readonly line: number;

   /**
    *
    */
   readonly column: number;

   /**
    *
    * @param offset {number}
    * @param line {number}
    * @param column {number}
    */
   constructor(offset: number, line: number, column: number) {
      this.offset = offset;
      this.line = line;
      this.column = column;
   }
}

/**
 *
 */
export interface ISourceReader {

   /**
    *
    */
   consume(): string | null;

   /**
    *
    */
   reconsume(): void;

   /**
    *
    */
   hasNext(): boolean;

   /**
    *
    */
   getPosition(): SourcePosition;
}

/**
 *
 */
export default class SourceReader implements ISourceReader {

   /**
    *
    */
   private readonly source: ISource;

   /**
    *
    */
   private offset: number = -1;

   /**
    *
    */
   private reconsumeFlag: boolean = false;

   /**
    *
    */
   private line: number = 0;

   /**
    *
    */
   private column: number = -1;

   /**
    *
    */
   private lastLF: boolean = false;

   /**
    *
    * @param source
    */
   constructor(source: ISource) {
      this.source = source;
   }

   /**
    *
    */
   consume(): string | null {
      if (this.reconsumeFlag) {
         this.reconsumeFlag = false;
         return this.getChar();
      }
      this.moveNext();
      const char = this.getChar();
      this.updateNavigation(char);
      return char;
   }

   /**
    *
    */
   reconsume(): void {
      if (this.offset > -1 && this.offset !== this.source.getLength()) {
         this.reconsumeFlag = true;
      }
   }

   /**
    *
    */
   hasNext(): boolean {
      if (this.reconsumeFlag) {
         return this.offset < this.source.getLength();
      }
      return this.offset + 1 < this.source.getLength();
   }

   /**
    *
    */
   getPosition(): SourcePosition {
      return new SourcePosition(
         this.offset,
         this.line,
         this.column
      );
   }

   /**
    *
    * @param char
    */
   private updateNavigation(char: string | null): void {
      if (this.lastLF) {
         this.lastLF = false;
         this.column = 0;
         ++this.line;
      }
      if (char === Characters.LINE_FEED) {
         this.lastLF = true;
      }
   }

   /**
    *
    */
   private moveNext(): void {
      if (this.offset < this.source.getLength()) {
         ++this.offset;
         ++this.column;
      }
   }

   /**
    *
    */
   private getChar(): string | null {
      if (this.offset < this.source.getLength()) {
         return this.source.getChar(this.offset);
      }
      return null;
   }
}
