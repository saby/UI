/// <amd-module name="UI/_builder/Tmpl/core/Text" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Text.ts
 */

import { canBeTranslated, splitLocalizationText } from 'UI/_builder/Tmpl/i18n/Helpers';
import * as Ast from 'UI/_builder/Tmpl/core/Ast';
import { IParser } from 'UI/_builder/Tmpl/expressions/_private/Parser';
import { IValidator } from 'UI/_builder/Tmpl/expressions/_private/Validator';
import { SourcePosition } from 'UI/_builder/Tmpl/html/Reader';

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
    * @param module {string} Template file where translation item was discovered.
    * @param text {string} Translation text.
    * @param context {string} Translation context.
    */
   registerTranslation(module: string, text: string, context: string): void;
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
 * Regular expression for Mustache-expression node content.
 */
const EXPRESSION_PATTERN = /\{\{ ?([\s\S]*?) ?\}\}/g;

/**
 * Regular expression for translation node content.
 */
const TRANSLATION_PATTERN = /\{\[ ?([\s\S]*?) ?\]\}/g;

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

/**
 * Type for text node wrappers.
 * Function accepts text contents and returns one of text nodes.
 */
declare type TWrapper = (data: string) => IRawTextItem;

/**
 * Process all text nodes and concrete them.
 * If text node content satisfies regular expression then new node will be created instead of that text node
 * using targetWrapper. If not then default wrapper will be used.
 * @param items {IRawTextItem[]} Collection of text nodes.
 * @param regex {RegExp} Target regular expression.
 * @param targetWrapper {TWrapper} Target text wrapper.
 * @param defaultWrapper {TWrapper} Default text wrapper.
 * @returns {IRawTextItem[]} Returns new collection of text nodes.
 */
function markDataByRegex(items: IRawTextItem[], regex: RegExp, targetWrapper: TWrapper, defaultWrapper: TWrapper): IRawTextItem[] {
   let item;
   let value;
   let stringData;
   let last;
   const collection = [];
   for (let idx = 0; idx < items.length; ++idx) {
      // FIXME: Алгоритм построен на поэтапном уточнении текстовых сущностей
      //  поэтому здесь нужно работать только с объектами, где strings[idx].type = 0
      //  но пока не будет хорошей документации и прикладной код не будет содержать ошибок,
      //  поддержим прежнюю работу
      stringData = items[idx].data;

      // С флагом global у регулярного выражения нужно сбрасывать индекс
      regex.lastIndex = 0;
      last = 0;
      // eslint-disable-next-line no-cond-assign
      while ((item = regex.exec(stringData))) {
         if (last < item.index) {
            value = stringData.slice(last, item.index);
            collection.push(defaultWrapper(value));
         }
         collection.push(targetWrapper(item[1]));
         last = item.index + item[0].length;
      }

      // В случае, если ни одна сущность не была уточнена, то просто положить ее такой же
      if (last === 0) {
         collection.push(items[idx]);
      } else if (last < stringData.length) {
         value = stringData.slice(last);
         collection.push(defaultWrapper(value));
      }
   }
   return collection;
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
 *
 * @param text
 */
function replaceNewLines(text: string): string {
   return text
      .replace(/\n\r/g, WHITESPACE)
      .replace(/\r\n/g, WHITESPACE)
      .replace(/\r/g, WHITESPACE)
      .replace(/\n/g, WHITESPACE);
}

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
 * @param data {string} Text content.
 * @param options {ITextProcessorOptions} Text processor options.
 * @throws {Error} Throws error if text data contains disallowed content type.
 * @returns {TextDataNode} Translation node.
 */
function createTranslationNode(data: string, options: ITextProcessorOptions): Ast.TranslationNode {
   if ((options.allowedContent & TextContentFlags.TRANSLATION) === 0) {
      throw new Error(`${whatExpected(options.allowedContent)}. Обнаружена конструкция локализации "${data}"`);
   }
   const { text, context } = splitLocalizationText(data);
   options.translationsRegistrar.registerTranslation(options.fileName, text, context);
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
      const cleanedText = cleanText(text);

      const firstStage: IRawTextItem[] = [{
         type: RawTextType.TEXT,
         data: cleanedText
      }];

      const secondStage = markDataByRegex(
         firstStage,
         EXPRESSION_PATTERN,
         (data: string) => { return { type: RawTextType.EXPRESSION, data }; },
         (data: string) => { return { type: RawTextType.TEXT, data }; }
      );

      const thirdStage = markDataByRegex(
         secondStage,
         TRANSLATION_PATTERN,
         (data: string) => { return { type: (this.generateTranslations ? RawTextType.TRANSLATION : RawTextType.TEXT), data }; },
         (data: string) => { return { type: RawTextType.TEXT, data }; }
      );

      return this.processMarkedStatements(thirdStage, options);
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
         const data = items[index].data;
         const isTranslatableItem = items.length === 1 && type === RawTextType.TEXT && options.translateText && canBeTranslated(items[0].data);
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
               node = createTranslationNode(data, options);
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
