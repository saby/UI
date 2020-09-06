/// <amd-module name="UI/_builder/Tmpl/core/Text" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Text.ts
 */

import { canBeTranslated, splitLocalizationText } from 'UI/_builder/Tmpl/i18n/Helpers';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import { IParser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import { SourcePosition } from 'UI/_builder/Tmpl/html/Reader';

/**
 * Interface for text processor config.
 */
interface ITextProcessorConfig {

   /**
    * Mustache expressions parser.
    */
   expressionParser: IParser;
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

   /**
    * Create translation nodes instead of text nodes.
    */
   translateText: boolean;
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
    * @throws {Error} Throws error if text data contains disallowed content type.
    * @returns {TText[]} Collection of text data nodes.
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
 * Get processing expectation for handling an error.
 * @param flags {TextContentFlags} Enabled flags.
 */
function whatExpected(flags: TextContentFlags): string {
   if (!(flags ^ TextContentFlags.TEXT_AND_EXPRESSION)) {
      return 'ожидался текст и/или Mustache-выражение';
   }
   if (!(flags ^ TextContentFlags.TEXT_AND_TRANSLATION)) {
      return 'ожидался текст и/или конструкция локализации';
   }
   if (!(flags ^ TextContentFlags.EXPRESSION)) {
      return 'ожидалось только Mustache-выражение';
   }
   if (!(flags ^ TextContentFlags.TRANSLATION)) {
      return 'ожидалась только конструкция локализации';
   }
   if (!(flags ^ TextContentFlags.TEXT_AND_EXPRESSION)) {
      return 'ожидался только текст';
   }
}

/**
 * Process final text node check.
 * @param nodes {TText[]} Processed nodes.
 * @param options {ITextProcessorOptions} Text processor options.
 * @param position {SourcePosition} Position in source file for text node.
 * @throws {Error} Throws error if text data collection contains disallowed content type.
 * @returns {TText[]} Collection of text data nodes.
 */
function finalizeContentCheck(nodes: Ast.TText[], options: ITextProcessorOptions, position: SourcePosition): Ast.TText[] {
   const isTextForbidden = !(options.allowedContent & TextContentFlags.TEXT);
   if (!isTextForbidden && !options.translateText) {
      return nodes;
   }
   const collection = [];
   for (let index = 0; index < nodes.length; ++index) {
      const node = nodes[index];
      if (!(node instanceof Ast.TextDataNode) || !canBeTranslated(node.__$ws_content)) {
         collection.push(node);
         continue;
      }
      if (isTextForbidden) {
         throw new Error(`${whatExpected(options.allowedContent)}. Обнаружен текст "${node.__$ws_content}"`);
      }
      collection.push(
         createTranslationNode(node.__$ws_content, options, position)
      );
   }
   return collection;
}

/**
 * Parse and create text node.
 * @param data {string} Text content.
 * @param options {ITextProcessorOptions} Text processor options.
 * @param position {SourcePosition} Position in source file for text node.
 * @throws {Error} Throws error if text data contains disallowed content type.
 * @returns {TextDataNode} Text data node.
 */
function createTextNode(data: string, options: ITextProcessorOptions, position: SourcePosition): Ast.TextDataNode {
   if ((options.allowedContent & TextContentFlags.TEXT) === 0) {
      throw new Error(`${whatExpected(options.allowedContent)}. Обнаружен текст "${data}"`);
   }
   return new Ast.TextDataNode(data);
}

/**
 * Parse and create translation node.
 * @param data {string} Text content.
 * @param options {ITextProcessorOptions} Text processor options.
 * @param position {SourcePosition} Position in source file for text node.
 * @throws {Error} Throws error if text data contains disallowed content type.
 * @returns {TextDataNode} Translation node.
 */
function createTranslationNode(data: string, options: ITextProcessorOptions, position: SourcePosition): Ast.TranslationNode {
   if ((options.allowedContent & TextContentFlags.TRANSLATION) === 0) {
      throw new Error(`${whatExpected(options.allowedContent)}. Обнаружена конструкция локализации "${data}"`);
   }
   const { text, context } = splitLocalizationText(data);
   return new Ast.TranslationNode(text, context);
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
    * Initialize new instance of text processor.
    * @param config {ITextProcessorConfig} Text processor config.
    */
   constructor(config: ITextProcessorConfig) {
      this.expressionParser = config.expressionParser;
   }

   /**
    * Process text data and create a collection of parsed text nodes.
    * @param text {string} Text data.
    * @param options {ITextProcessorOptions} Text processor options.
    * @param position {SourcePosition} Position in source file for text node.
    * @throws {Error} Throws error if text data contains disallowed content type.
    * @returns {TText[]} Collection of text data nodes.
    */
   process(text: string, options: ITextProcessorOptions, position: SourcePosition): Ast.TText[] {
      const internalOptions: ITextProcessorOptions = {
         ...options,
         allowedContent: options.allowedContent | TextContentFlags.TEXT
      };
      const firstStage = [
         createTextNode(text, internalOptions, position)
      ];

      const secondStage = markDataByRegex(
         firstStage,
         EXPRESSION_PATTERN,
         (data: string) => this.createExpressionNode(data, internalOptions, position),
         (data: string) => createTextNode(data, internalOptions, position)
      );

      const thirdStage = markDataByRegex(
         secondStage,
         TRANSLATION_PATTERN,
         (data: string) => createTranslationNode(data, internalOptions, position),
         (data: string) => createTextNode(data, internalOptions, position)
      );

      return finalizeContentCheck(thirdStage, options, position);
   }

   /**
    * Parse and create Mustache-expression node.
    * @param data {string} Text content.
    * @param options {ITextProcessorOptions} Text processor options.
    * @param position {SourcePosition} Position in source file for text node.
    * @throws {Error} Throws error if text data contains disallowed content type.
    * @returns {ExpressionNode} Expression node.
    */
   private createExpressionNode(data: string, options: ITextProcessorOptions, position: SourcePosition): Ast.ExpressionNode {
      if ((options.allowedContent & TextContentFlags.EXPRESSION) === 0) {
         throw new Error(`${whatExpected(options.allowedContent)}. Обнаружено Mustache-выражение "${data}"`);
      }

      // TODO: warn about empty Mustache-expressions.
      if (data.trim().length === 0) {
         return null;
      }
      try {
         const programNode = this.expressionParser.parse(data);
         return new Ast.ExpressionNode(programNode);
      } catch (error) {
         throw new Error(`Mustache-выражение "${data}" некорректно`);
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
