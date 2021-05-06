/**
 * @description Represents text processor.
 * @author Крылов М.А.
 */

import { canBeTranslated, splitLocalizationText } from 'Compiler/i18n/Helpers';
import * as Ast from 'Compiler/core/Ast';
import { IParser } from 'Compiler/expressions/Parser';
import { IValidator } from 'Compiler/expressions/Validator';
import { SourcePosition } from 'Compiler/html/Reader';
import { TranslationType } from 'Compiler/i18n/Dictionary';

/**
 * Interface for text processor config.
 */
interface ITextProcessorConfig {

   /**
    * Mustache expressions parser.
    */
   expressionParser: IParser;

   /**
    * Mustache-expressions validator.
    */
   expressionValidator: IValidator;

   /**
    * Generate translation nodes.
    */
   generateTranslations: boolean;
}

/**
 * Interface for translations registrar.
 */
export interface ITranslationsRegistrar {

   /**
    * Register translation key.
    * @param type {TranslationType} Translation type.
    * @param module {string} Template file where translation item was discovered.
    * @param text {string} Translation text.
    * @param context {string} Translation context.
    */
   registerTranslation(type: TranslationType, module: string, text: string, context: string): void;
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

   /**
    * Translations registrar.
    */
   translationsRegistrar: ITranslationsRegistrar;

   /**
    * Position of processing text in source file.
    */
   position: SourcePosition;
}

/**
 * Interface for text processor.
 */
export interface ITextProcessor {

   /**
    * Process text data and create a collection of parsed text nodes.
    * @param text {string} Text data.
    * @param options {ITextProcessorOptions} Text processor options.
    * @throws {Error} Throws error if text data contains disallowed content type.
    * @returns {TText[]} Collection of text data nodes.
    */
   process(text: string, options: ITextProcessorOptions): Ast.TText[];
}

/**
 * Regular expression for JavaScript comment expression.
 */
const JAVASCRIPT_COMMENT_PATTERN = /\/\*[\s\S]*?\*\//g;

/**
 * Safe replacing
 */
const SAFE_REPLACE_CASE_PATTERN = /\r|\n|\t|\/\*[\s\S]*?\*\//g;

/**
 * Safe whitespaces replacing
 */
const SAFE_WHITESPACE_REMOVE_PATTERN = / +(?= )/g;

/**
 * Empty string constant
 */
const EMPTY_STRING = '';

/**
 * Whitespace constant
 */
const WHITESPACE = ' ';

/**
 * Processed text type
 */
const enum RawTextType {

   /**
    * Text content type
    */
   TEXT,

   /**
    * Mustache-expression content type
    */
   EXPRESSION,

   /**
    * Translation content type
    */
   TRANSLATION
}

/**
 * Processed text item
 */
interface IRawTextItem {

   /**
    * Text type
    */
   type: RawTextType;

   /**
    * Text content
    */
   data: string;
}

enum StringState {
   NONE,
   SINGLE_QUOTED,
   DOUBLE_QUOTED
}

function checkStringState(char: string, state: StringState): StringState | null {
   if (char === "'") {
      if (state === StringState.NONE) {
         return StringState.SINGLE_QUOTED;
      }
      if (state === StringState.SINGLE_QUOTED) {
         return StringState.NONE;
      }
   }
   if (char === '"') {
      if (state === StringState.NONE) {
         return StringState.DOUBLE_QUOTED;
      }
      if (state === StringState.DOUBLE_QUOTED) {
         return StringState.NONE;
      }
   }
   return state;
}

function prepareTextData(type: RawTextType, text: string, start: number, end?: number): string {
   const data = text.slice(start, end);
   if (type === RawTextType.TEXT) {
      return data;
   }
   return data
       .replace(/^ ?/i, EMPTY_STRING)
       .replace(/ ?$/i, EMPTY_STRING);
}

function flushFragment(result: IRawTextItem[], text: string, textType: RawTextType, start: number, end?: number): void {
   const data = prepareTextData(textType, text, start, end);
   const lastNode: IRawTextItem | undefined = result[result.length - 1];
   if (lastNode && lastNode.type === RawTextType.TEXT && textType === RawTextType.TEXT) {
      lastNode.data = lastNode.data + data;
      return;
   }
   result.push({
      type: textType,
      data
   });
}

function parse(text: string): IRawTextItem[] {
   const result: IRawTextItem[] = [];
   let textType: RawTextType = RawTextType.TEXT;
   let stringState: StringState = StringState.NONE;
   let start: number = 0;
   for (let cursor: number = 0; cursor < text.length; ++cursor) {
      const char = text[cursor];
      const nextChar = text[cursor + 1] || EMPTY_STRING;

      // Skip escape characters in string literals in mustache expression
      if (char === '\\' && (nextChar === '"' || nextChar === "'")) {
         ++cursor;
         continue;
      }

      // Skip string literals in mustache expression
      if (textType === RawTextType.EXPRESSION) {
         stringState = checkStringState(char, stringState);
         if (stringState !== StringState.NONE) {
            continue;
         }
      }

      // Process opening construction.
      const isOpeningExpression = textType === RawTextType.TEXT && char === '{' && nextChar === '{';
      const isOpeningTranslation = textType === RawTextType.TEXT && char === '{' && nextChar === '[';
      if (isOpeningExpression || isOpeningTranslation) {
         if (start < cursor) {
            flushFragment(result, text, textType, start, cursor);
         }
         textType = isOpeningExpression ? RawTextType.EXPRESSION : RawTextType.TRANSLATION;
         start = cursor + 2;
         ++cursor;
         continue;
      }

      // Process closing construction.
      const isClosingExpression = textType === RawTextType.EXPRESSION && char === '}' && nextChar === '}';
      const isClosingTranslation = textType === RawTextType.TRANSLATION && char === ']' && nextChar === '}';
      if (isClosingExpression || isClosingTranslation) {
         flushFragment(result, text, textType, start, cursor);
         textType = RawTextType.TEXT;
         start = cursor + 2;
         ++cursor;
      }
   }
   if (start < text.length || result.length === 0) {
      const shift = textType === RawTextType.TEXT ? 0 : 2;
      flushFragment(result, text, RawTextType.TEXT, start - shift);
   }
   return result;
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
   if (!(flags ^ TextContentFlags.TEXT)) {
      return 'ожидался только текст';
   }
}

/**
 * Replace new lines.
 * @param text {string} Input source text.
 */
function replaceNewLines(text: string): string {
   return text
      .replace(/\n\r/g, WHITESPACE)
      .replace(/\r\n/g, WHITESPACE)
      .replace(/\r/g, WHITESPACE)
      .replace(/\n/g, WHITESPACE);
}

/**
 * Clean text from whitespaces.
 * @param text {string} Input source text.
 */
function cleanText(text: string): string {
   SAFE_REPLACE_CASE_PATTERN.lastIndex = 0;
   SAFE_WHITESPACE_REMOVE_PATTERN.lastIndex = 0;

   return text
      .replace(SAFE_REPLACE_CASE_PATTERN, ' ')
      .replace(SAFE_WHITESPACE_REMOVE_PATTERN, EMPTY_STRING);
}

/**
 * Parse and create text node.
 * @param data {string} Text content.
 * @param options {ITextProcessorOptions} Text processor options.
 * @throws {Error} Throws error if text data contains disallowed content type.
 * @returns {TextDataNode} Text data node.
 */
function createTextNode(data: string, options: ITextProcessorOptions): Ast.TextDataNode {
   if ((options.allowedContent & TextContentFlags.TEXT) === 0) {
      if (/^\s+$/gi.test(data)) {
         // Ignore tabulation spaces
         return null;
      }
      throw new Error(`${whatExpected(options.allowedContent)}. Обнаружен текст "${data}"`);
   }
   return new Ast.TextDataNode(data);
}

/**
 * Parse and create translation node.
 * @param type {TranslationType} Translation type.
 * @param data {string} Text content.
 * @param options {ITextProcessorOptions} Text processor options.
 * @throws {Error} Throws error if text data contains disallowed content type.
 * @returns {TextDataNode} Translation node.
 */
function createTranslationNode(type: TranslationType, data: string, options: ITextProcessorOptions): Ast.TranslationNode {
   if ((options.allowedContent & TextContentFlags.TRANSLATION) === 0) {
      throw new Error(`${whatExpected(options.allowedContent)}. Обнаружена конструкция локализации "${data}"`);
   }
   const { text, context } = splitLocalizationText(data);
   options.translationsRegistrar.registerTranslation(type, options.fileName, text, context);
   return new Ast.TranslationNode(text, context);
}

/**
 * Fill order keys to collection of extended text nodes.
 * @param collection {TText[]} Collection of extended text nodes.
 */
function fillKeys(collection: Ast.TText[]): void {
   for (let index = 0; index < collection.length; ++index) {
      collection[index].setKey(index);
   }
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
    * Mustache-expressions validator.
    */
   private readonly expressionValidator: IValidator;

   /**
    * Generate translation nodes.
    */
   private readonly generateTranslations: boolean;

   /**
    * Initialize new instance of text processor.
    * @param config {ITextProcessorConfig} Text processor config.
    */
   constructor(config: ITextProcessorConfig) {
      this.expressionParser = config.expressionParser;
      this.expressionValidator = config.expressionValidator;
      this.generateTranslations = config.generateTranslations;
   }

   /**
    * Process text data and create a collection of parsed text nodes.
    * @param text {string} Text data.
    * @param options {ITextProcessorOptions} Text processor options.
    * @throws {Error} Throws error if text data contains disallowed content type.
    * @returns {TText[]} Collection of text data nodes.
    */
   process(text: string, options: ITextProcessorOptions): Ast.TText[] {
      // FIXME: Rude source text preprocessing
      const chain: IRawTextItem[] = parse(cleanText(text));
      return this.processMarkedStatements(chain, options);
   }

   /**
    * Create text nodes of abstract syntax tree.
    * @param items {IRawTextItem[]} Collection of text nodes.
    * @param options {ITextProcessorOptions} Text processor options.
    */
   private processMarkedStatements(items: IRawTextItem[], options: ITextProcessorOptions): Ast.TText[] {
      let node: Ast.TText;
      let cursor: number = 0;
      const collection: Ast.TText[] = [];
      for (let index = 0; index < items.length; index++) {
         let type = items[index].type;
         const translationType = type === RawTextType.TRANSLATION ? 'manual' : 'auto';
         const data = items[index].data;
         const isTranslatableItem = items.length === 1 && type === RawTextType.TEXT
             && options.translateText && canBeTranslated(items[0].data);
         if (data.trim() === EMPTY_STRING && type !== RawTextType.TEXT) {
            // TODO: Do not process empty strings.
            //  1) Warn in case of empty mustache expressions
            //  2) Warn in case of empty translations
            continue;
         }
         node = null;
         if (isTranslatableItem) {
            type = RawTextType.TRANSLATION;
         }
         switch (type) {
            case RawTextType.EXPRESSION:
               node = this.createExpressionNode(data, options);
               break;
            case RawTextType.TRANSLATION:
               if (this.generateTranslations) {
                  node = createTranslationNode(translationType, data, options);
                  break;
               }
               node = createTextNode(data, options);
               break;
            default:
               node = createTextNode(data, options);
               break;
         }
         if (node) {
            collection.splice(cursor, 0, node);
         }
         if (isTranslatableItem) {
            if (/^\s+/gi.test(items[index].data)) {
               // Has important spaces before text
               collection.splice(cursor - 1, 0, createTextNode(' ', options));
               ++cursor;
            }
            if (/\s+$/gi.test(items[index].data)) {
               // Has important spaces after text
               collection.splice(cursor + 1, 0, createTextNode(' ', options));
               ++cursor;
            }
         }
         ++cursor;
      }

      // FIXME: There can be empty collection. Return at least empty string
      if (collection.length === 0) {
         collection.push(new Ast.TextDataNode(EMPTY_STRING));
      }
      fillKeys(collection);
      return collection;
   }

   /**
    * Parse and create Mustache-expression node.
    * @param data {string} Text content.
    * @param options {ITextProcessorOptions} Text processor options.
    * @throws {Error} Throws error if text data contains disallowed content type.
    * @returns {ExpressionNode} Expression node.
    */
   private createExpressionNode(data: string, options: ITextProcessorOptions): Ast.ExpressionNode {
      if ((options.allowedContent & TextContentFlags.EXPRESSION) === 0) {
         throw new Error(`${whatExpected(options.allowedContent)}. Обнаружено Mustache-выражение "${data}"`);
      }
      try {
         JAVASCRIPT_COMMENT_PATTERN.lastIndex = 0;
         const programText = replaceNewLines(data)
            .replace(JAVASCRIPT_COMMENT_PATTERN, EMPTY_STRING);
         if (programText.trim() === EMPTY_STRING) {
            return null;
         }
         const programNode = this.expressionParser.parse(programText);
         this.expressionValidator.checkTextExpression(
            programNode,
            options
         );
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
