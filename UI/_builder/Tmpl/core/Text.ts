/// <amd-module name="UI/_builder/Tmpl/core/Text" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Text.ts
 */

import { splitLocalizationText } from './i18n';
import * as Ast from './Ast';
import { IErrorHandler } from '../utils/ErrorHandler';
import { IParser } from '../expressions/_private/Parser';
import { SourcePosition } from '../html/Reader';

/**
 * Interface for text processor config.
 */
interface ITextProcessorConfig {

   /**
    * Mustache expressions parser.
    */
   expressionParser: IParser;

   /**
    * Error handler.
    */
   errorHandler: IErrorHandler;
}

/**
 * Flags for allowed text content.
 */
export enum TextContentFlags {

   /**
    * Only text nodes are allowed.
    */
   TEXT = 1,

   /**
    * Only Mustache-expression nodes are allowed.
    */
   EXPRESSION = 2,

   /**
    * Only translation nodes are allowed.
    */
   TRANSLATION = 4,

   /**
    * Only text and translation nodes are allowed.
    */
   TEXT_AND_TRANSLATION = TEXT | TRANSLATION,

   /**
    * Only text and Mustache-expression are allowed.
    */
   TEXT_AND_EXPRESSION = TEXT | EXPRESSION,

   /**
    * All nodes are allowed.
    */
   FULL_TEXT = TEXT | EXPRESSION | TRANSLATION
}

/**
 * Interface for text processor options.
 */
export interface ITextProcessorOptions {

   /**
    * Template file name.
    */
   fileName: string;

   /**
    * Flags for allowed text content.
    */
   allowedContent: TextContentFlags;
}

/**
 * Interface for text processor.
 */
export interface ITextProcessor {

   /**
    * Process text data and create a collection of parsed text nodes.
    * @param text {string} Text data.
    * @param options {ITextProcessorOptions} Text processor options.
    * @param position {SourcePosition} Position in source file for text node.
    */
   process(text: string, options: ITextProcessorOptions, position: SourcePosition): Ast.TText[];
}

/**
 * Regular expression for Mustache-expression node content.
 */
const EXPRESSION_PATTERN = /\{\{ ?([\s\S]*?) ?\}\}/g;

/**
 * Regular expression for translation node content.
 */
const TRANSLATION_PATTERN = /\{\[ ?([\s\S]*?) ?\]\}/g;

/**
 * Type for text node wrappers.
 * Function accepts text contents and returns one of text nodes.
 */
declare type TWrapper = (data: string) => Ast.TText;

/**
 * Process all text nodes and concrete them.
 * If text node content satisfies regular expression then new node will be created instead of that text node
 * using targetWrapper. If not then default wrapper will be used.
 * @param nodes {TText[]} Collection of text nodes.
 * @param regex {RegExp} Target regular expression.
 * @param targetWrapper {TWrapper} Target text wrapper.
 * @param defaultWrapper {TWrapper} Default text wrapper.
 * @returns {TText[]} Returns new collection of text nodes.
 */
function markDataByRegex(
   nodes: Ast.TText[],
   regex: RegExp,
   targetWrapper: TWrapper,
   defaultWrapper: TWrapper
): Ast.TText[] {
   let item;
   let createdNode;
   let value;
   let last;
   const data = [];
   for (let idx = 0; idx < nodes.length; ++idx) {
      if (!(nodes[idx] instanceof Ast.TextDataNode)) {
         data.push(nodes[idx]);
         continue;
      }

      const stringData = (<Ast.TextDataNode>nodes[idx]).__$ws_content;

      regex.lastIndex = 0;
      last = 0;
      while ((item = regex.exec(stringData))) {
         if (last < item.index) {
            value = stringData.slice(last, item.index);
            createdNode = defaultWrapper(value);
            if (createdNode) {
               data.push(createdNode);
            }
         }
         createdNode = targetWrapper(item[1]);
         if (createdNode) {
            data.push(createdNode);
         }
         last = item.index + item[0].length;
      }

      if (last === 0) {
         data.push(nodes[idx]);
      } else if (last < stringData.length) {
         value = stringData.slice(last);
         createdNode = defaultWrapper(value);
         if (createdNode) {
            data.push(createdNode);
         }
      }
   }
   return data;
}

/**
 * Represents methods to process html text nodes.
 */
class TextProcessor implements ITextProcessor {

   /**
    * Mustache expressions parser.
    */
   private readonly expressionParser: IParser;

   /**
    * Error handler.
    */
   private readonly errorHandler: IErrorHandler;

   /**
    * Initialize new instance of text processor.
    * @param config {ITextProcessorConfig} Text processor config.
    */
   constructor(config: ITextProcessorConfig) {
      this.expressionParser = config.expressionParser;
      this.errorHandler = config.errorHandler;
   }

   /**
    * Process text data and create a collection of parsed text nodes.
    * @param text {string} Text data.
    * @param options {ITextProcessorOptions} Text processor options.
    * @param position {SourcePosition} Position in source file for text node.
    */
   process(text: string, options: ITextProcessorOptions, position: SourcePosition): Ast.TText[] {
      const internalOptions: ITextProcessorOptions = {
         ...options,
         allowedContent: options.allowedContent | TextContentFlags.TEXT
      };
      const firstStage = [
         this.createTextNode(text, internalOptions, position)
      ];

      const secondStage = markDataByRegex(
         firstStage,
         EXPRESSION_PATTERN,
         (data: string) => this.createExpressionNode(data, internalOptions, position),
         (data: string) => this.createTextNode(data, internalOptions, position)
      );

      const thirdStage = markDataByRegex(
         secondStage,
         TRANSLATION_PATTERN,
         (data: string) => this.createTranslationNode(data, internalOptions, position),
         (data: string) => this.createTextNode(data, internalOptions, position)
      );

      return this.finalizeContentCheck(thirdStage, options, position);
   }

   /**
    * Process final text node check.
    * @param nodes {TText[]} Processed nodes.
    * @param options {ITextProcessorOptions} Text processor options.
    * @param position {SourcePosition} Position in source file for text node.
    */
   private finalizeContentCheck(nodes: Ast.TText[], options: ITextProcessorOptions, position: SourcePosition): Ast.TText[] {
      if (options.allowedContent & TextContentFlags.TEXT) {
         return nodes;
      }
      const collection = [];
      for (let index = 0; index < nodes.length; ++index) {
         if (nodes[index] instanceof Ast.TextDataNode) {
            const textData = (<Ast.TextDataNode>nodes[index]).__$ws_content;
            this.errorHandler.error(
               `Использование текстовых данных запрещено в данном контексте. Текст "${textData}" будет отброшен`,
               {
                  fileName: options.fileName,
                  position
               }
            );
            continue;
         }
         collection.push(nodes[index]);
      }
      return collection;
   }

   /**
    * Parse and create text node.
    * @param data {string} Text content.
    * @param options {ITextProcessorOptions} Text processor options.
    * @param position {SourcePosition} Position in source file for text node.
    */
   private createTextNode(data: string, options: ITextProcessorOptions, position: SourcePosition): Ast.TextDataNode {
      if ((options.allowedContent & TextContentFlags.TEXT) === 0) {
         this.errorHandler.error(
            `Использование текстовых данных запрещено в данном контексте. Текст "${data}" будет отброшен`,
            {
               fileName: options.fileName,
               position
            }
         );
         return null;
      }
      return new Ast.TextDataNode(data);
   }

   /**
    * Parse and create translation node.
    * @param data {string} Text content.
    * @param options {ITextProcessorOptions} Text processor options.
    * @param position {SourcePosition} Position in source file for text node.
    */
   private createTranslationNode(data: string, options: ITextProcessorOptions, position: SourcePosition): Ast.TranslationNode {
      if ((options.allowedContent & TextContentFlags.TRANSLATION) === 0) {
         this.errorHandler.error(
            `Использование конструкции локализации запрещено в данном контексте. Текст "${data}" будет отброшен`,
            {
               fileName: options.fileName,
               position
            }
         );
         return null;
      }
      try {
         const { text, context } = splitLocalizationText(data);
         return new Ast.TranslationNode(text, context);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора конструкции локализации: ${error.message}. Текст "${data}" будет отброшен`,
            {
               fileName: options.fileName,
               position
            }
         );
         return null;
      }
   }

   /**
    * Parse and create Mustache-expression node.
    * @param data {string} Text content.
    * @param options {ITextProcessorOptions} Text processor options.
    * @param position {SourcePosition} Position in source file for text node.
    */
   private createExpressionNode(data: string, options: ITextProcessorOptions, position: SourcePosition): Ast.ExpressionNode {
      if ((options.allowedContent & TextContentFlags.EXPRESSION) === 0) {
         this.errorHandler.error(
            `Использование Mustache-выражения запрещено в данном контексте. Выражение "${data}" будет отброшено`,
            {
               fileName: options.fileName,
               position
            }
         );
         return null;
      }
      try {
         const programNode = this.expressionParser.parse(data);
         return new Ast.ExpressionNode(programNode);
      } catch (error) {
         this.errorHandler.error(
            `Ошибка разбора Mustache-выражения: ${error.message}. Текст "${data}" будет отброшен`,
            {
               fileName: options.fileName,
               position
            }
         );
         return null;
      }
   }
}

/**
 * Create new instance of text processor.
 * @param config {ITextProcessorConfig} Text processor config.
 * @returns {ITextProcessor} Returns new instance of text processor that implements ITextProcessor interface.
 */
export function createTextProcessor(config: ITextProcessorConfig): ITextProcessor {
   return new TextProcessor(config);
}

/**
 * Remove curly brackets from Mustache expression text.
 * @param text {string} Mustache expression text.
 */
export function cleanMustacheExpression(text: string): string {
   return text
      .replace(/^\s*{{\s*/i, '')
      .replace(/\s*}}\s*$/i, '');
}
