/// <amd-module name="UI/_builder/Tmpl/html/Tokenizer" />

/**
 * @author Крылов М.А.
 */

import { ContentModel } from './ContentModel';
import { ISource } from './Source';
import SourceReader, { SourcePosition } from './Reader';
import { IAttributes, Attribute } from './Nodes';
import * as Characters from './Characters';
import { IErrorHandler } from '../utils/ErrorHandler';
import { isValidNameCharacter, isValidName } from './Names';

/**
 *
 */
const enum State {
   // Data content model
   DATA,
   BEFORE_EXPRESSION,
   IN_EXPRESSION,
   AFTER_EXPRESSION,
   TAG_OPEN,
   END_TAG_OPEN,
   TAG_NAME,
   BEFORE_ATTRIBUTE_NAME,
   ATTRIBUTE_NAME,
   AFTER_ATTRIBUTE_NAME,
   BEFORE_ATTRIBUTE_VALUE,
   ATTRIBUTE_VALUE_DOUBLE_QUOTED,
   ATTRIBUTE_VALUE_SINGLE_QUOTED,
   ATTRIBUTE_VALUE_UNQUOTED,
   AFTER_ATTRIBUTE_VALUE_QUOTED,
   SELF_CLOSING_START_TAG,
   BOGUS_COMMENT,
   BOGUS_COMMENT_HYPHEN,
   MARKUP_DECLARATION_OPEN,
   MARKUP_DECLARATION_HYPHEN,
   MARKUP_DECLARATION_OCTYPE,
   CDATA_START,
   COMMENT_START,
   COMMENT_START_DASH,
   COMMENT,
   COMMENT_END_DASH,
   COMMENT_END,
   COMMENT_END_BANG,
   DOCTYPE,
   CDATA_SECTION,
   CDATA_RSQB,
   CDATA_RSQB_RSQB,
   INSTRUCTION,
   INSTRUCTION_QUESTION_MARK,

   // Raw text content model
   RAW_TEXT,
   RAW_TEXT_LESS_THAN_SIGN,
   RAW_TEXT_ESCAPE_START,
   RAW_TEXT_ESCAPE_START_DASH,
   RAW_TEXT_ESCAPED,
   RAW_TEXT_ESCAPED_DASH,
   RAW_TEXT_ESCAPED_DASH_DASH,
   RAW_TEXT_ESCAPED_LESS_THAN_SIGN,
   RAW_TEXT_ESCAPED_END_TAG_OPEN,
   RAW_TEXT_ESCAPED_END_TAG_NAME,
   RAW_TEXT_DOUBLE_ESCAPE_START,
   RAW_TEXT_DOUBLE_ESCAPED,
   RAW_TEXT_DOUBLE_ESCAPED_DASH,
   RAW_TEXT_DATA_DOUBLE_ESCAPED_DASH_DASH,
   RAW_TEXT_DOUBLE_ESCAPED_LESS_THAN_SIGN,
   RAW_TEXT_DOUBLE_ESCAPE_END,

   // Escapable content model
   ESCAPABLE_RAW_TEXT,
   ESCAPABLE_RAW_TEXT_LESS_THAN_SIGN,
   ESCAPABLE_RAW_TEXT_END_TAG_NAME
}

/**
 *
 */
export interface ITokenizerOptions {
   /**
    *
    */
   allowComments: boolean;

   /**
    *
    */
   allowCDATA: boolean;

   /**
    *
    */
   errorHandler: IErrorHandler;

   /**
    *
    */
   xml: boolean;
}

/**
 * Interface for token handler.
 */
export interface ITokenHandler {

   /**
    * Emit open tag token.
    * @param name {string} Tag name.
    * @param attributes {IAttributes} Tag attributes.
    * @param selfClosing {boolean} Flag whether tag is self-closing.
    * @param position {SourcePosition} Token start position.
    */
   onOpenTag(name: string, attributes: IAttributes, selfClosing: boolean, position: SourcePosition): void;

   /**
    * Emit close tag token.
    * @param name {string} Tag name.
    * @param position {SourcePosition} Token start position.
    */
   onCloseTag(name: string, position: SourcePosition): void;

   /**
    * Emit text token.
    * @param data {string} Text data.
    * @param position {SourcePosition} Token start position.
    */
   onText(data: string, position: SourcePosition): void;

   /**
    * Emit comment token.
    * @param data {string} Comment data.
    * @param position {SourcePosition} Token start position.
    */
   onComment(data: string, position: SourcePosition): void;

   /**
    * Emit CDATA token.
    * @param data {string} Text data placed inside CDATA section.
    * @param position {SourcePosition} Token start position.
    */
   onCDATA(data: string, position: SourcePosition): void;

   /**
    * Emit doctype token.
    * @param data {string} Text data placed inside doctype declaration.
    * @param position {SourcePosition} Token start position.
    */
   onDoctype(data: string, position: SourcePosition): void;

   /**
    * Emit instruction token.
    * @param data {string} Text data placed inside instruction.
    * @param position {SourcePosition} Token start position.
    */
   onInstruction(data: string, position: SourcePosition): void;

   /**
    * Emit end of file token.
    */
   onEOF(position: SourcePosition): void;
}

/**
 * Interface for tokenizer.
 *
 * @link https://www.w3.org/TR/2011/WD-html5-20110525/tokenization.html#tokenization
 */
export interface ITokenizer {

   /**
    * Start tokenize process of input source.
    * @param source {ISource} The object that implements the interface ISource
    * and contains data for tokenize process.
    */
   tokenize(source: ISource): void;

   /**
    * Force set content model during the tokenize process.
    * @param contentModel {ContentModel} Content model.
    * @param expectingEndTagName {string} The name of the tag which indicates that
    * the tokenizer should go out of this content model state in its previous state.
    */
   setContentModel(contentModel: ContentModel, expectingEndTagName: string): void;
}

/**
 *
 * @param contentModel {ContentModel}
 */
function getStateByContentModel(contentModel: ContentModel): State {
   switch (contentModel) {
      case ContentModel.RAW_TEXT:
         return State.RAW_TEXT;
      case ContentModel.ESCAPABLE_RAW_TEXT:
         return State.ESCAPABLE_RAW_TEXT;
      default:
         return State.DATA;
   }
}

/**
 *
 */
const CDATA: string = 'CDATA[';

/**
 *
 */
const DOCTYPE: string = 'OCTYPE';

/**
 *
 *
 * @link https://www.w3.org/TR/2011/WD-html5-20110525/tokenization.html#tokenization
 */
export class Tokenizer implements ITokenizer {

   /**
    *
    */
   private readonly tokenHandler: ITokenHandler;

   /**
    *
    */
   private readonly errorHandler: IErrorHandler;

   /**
    *
    */
   private readonly allowComments: boolean;

   /**
    *
    */
   private readonly allowCDATA: boolean;

   /**
    *
    */
   private readonly xml: boolean;

   /**
    *
    */
   private expectingEndTagName: string = '';

   /**
    *
    */
   private state: State = State.DATA;

   /**
    *
    */
   private returnState: State = State.DATA;

   /**
    *
    */
   private charBuffer: string = '';

   /**
    *
    */
   private index: number = Number.MAX_VALUE;

   /**
    *
    */
   private endTag: boolean = false;

   /**
    *
    */
   private tagName: string = '';

   /**
    *
    */
   private attributes: IAttributes | null;

   /**
    *
    */
   private selfClosing: boolean = false;

   /**
    *
    */
   private attributeName: string = '';

   /**
    *
    */
   private fileName: string = '[[unknown]]';

   /**
    *
    */
   private startPosition: SourcePosition | null = null;

   /**
    *
    */
   private currentPosition: SourcePosition | null = null;

   /**
    *
    */
   private returnExpressionCharacter: string | null = null;

   /**
    *
    * @param tokenHandler {ITokenHandler}
    * @param options {ITokenizerOptions}
    */
   constructor(tokenHandler: ITokenHandler, options: ITokenizerOptions) {
      this.tokenHandler = tokenHandler;
      this.errorHandler = options.errorHandler;
      this.allowComments = options.allowComments;
      this.allowCDATA = options.allowCDATA;
      this.xml = options.xml;
   }

   /**
    *
    * @param source {ISource}
    */
   tokenize(source: ISource): void {
      let char;
      let treatAsDefault;
      const reader = new SourceReader(source);
      this.fileName = source.getPath();
      while (reader.hasNext()) {
         char = reader.consume() as string;
         this.currentPosition = reader.getPosition();
         switch (this.state) {
            case State.DATA:
               // Consume the next input character.
               switch (char) {
                  case Characters.AMPERSAND:
                     // Switch to the character reference in data state.
                     // TODO: release
                     // this.returnState = this.state;
                     // this.state = State.CHARACTER_REFERENCE;
                     this.appendCharBuffer(char);
                     // this.appendReferenceBuffer(char);
                     // this.setAdditionalCharacter(Characters.NULL);
                     break;
                  case Characters.LESS_THAN_SIGN:
                     // Switch to the tag open state.
                     this.state = State.TAG_OPEN;
                     this.flushCharBuffer();
                     this.commitPosition();
                     break;
                  case Characters.NULL:
                     // Parse error. Emit a REPLACEMENT CHARACTER character as a character token.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  case Characters.LEFT_CURLY_BRACKET:
                     // Switch to the special Wasaby state for mustache-expression.
                     // Emit the current input character as a character token.
                     this.returnState = this.state;
                     this.state = State.BEFORE_EXPRESSION;
                     this.appendCharBuffer(char);
                     break;
                  default:
                     // Emit the current input character as a character token.
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.BEFORE_EXPRESSION:
               // Special Wasaby state. Consume the next input character.
               switch (char) {
                  case Characters.LEFT_CURLY_BRACKET:
                     this.state = State.IN_EXPRESSION;
                     this.appendCharBuffer(char);
                     break;
                  default:
                     this.state = this.returnState;
                     reader.reconsume();
                     break;
               }
               break;
            case State.IN_EXPRESSION:
               // Special Wasaby state. Consume the next input character.
               if (char === this.returnExpressionCharacter) {
                  // TODO: Enable warning
                  // this.warn(`Нельзя использовать символы QUOTATION_MARK (") и APOSTROPHE (') в Mustache-выражении, если они открывают и закрывают значение атрибута`);
               }
               this.appendCharBuffer(char);
               if (char === Characters.RIGHT_CURLY_BRACKET) {
                  this.state = State.AFTER_EXPRESSION;
               }
               break;
            case State.AFTER_EXPRESSION:
               // Special Wasaby state. Consume the next input character.
               switch (char) {
                  case Characters.RIGHT_CURLY_BRACKET:
                     this.returnExpressionCharacter = null;
                     this.state = this.returnState;
                     this.appendCharBuffer(char);
                     break;
                  default:
                     this.state = State.IN_EXPRESSION;
                     reader.reconsume();
                     break;
               }
               break;
            case State.TAG_OPEN:
               // Consume the next input character.
               if (char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z') {
                  // Create a new start tag token, set its tag name to the the current input character,
                  // then switch to the tag name state. (Don't emit the token yet;
                  // further details will be filled in before it is emitted.)
                  this.state = State.TAG_NAME;
                  this.endTag = false;
                  this.cleanCharBuffer();
                  this.appendCharBuffer(char);
                  break;
               }
               switch (char) {
                  case Characters.EXCLAMATION_MARK:
                     // Switch to the markup declaration open state.
                     this.state = State.MARKUP_DECLARATION_OPEN;
                     break;
                  case Characters.SOLIDUS:
                     // Switch to the end tag open state.
                     this.state = State.END_TAG_OPEN;
                     break;
                  case Characters.QUESTION_MARK:
                     // Parse error in HTML. Switch to the bogus comment state.
                     if (this.xml) {
                        this.state = State.INSTRUCTION;
                        this.appendCharBuffer(char);
                        break;
                     }
                     this.state = State.BOGUS_COMMENT;
                     this.error(`Некорректный символ ? в "${this.charBuffer + char}". Возможная причина: не включена поддержка XML`);
                     this.cleanCharBuffer();
                     this.appendCharBuffer(char);
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     this.state = State.DATA;
                     this.warn(`Некорректный символ < в "${this.charBuffer + char}". Возможная причина: символ < не был экранирован (как &lt;)`);
                     this.appendCharBuffer('<>');
                     break;
                  default:
                     // Parse error. Emit a LESS-THAN SIGN character token and
                     // reconsume the current input character in the data state.
                     this.state = State.DATA;
                     this.warn(`Некорректный символ < в "${this.charBuffer + char}". Возможная причина: символ < не был экранирован (как &lt;)`);
                     reader.reconsume();
                     this.appendCharBuffer(Characters.LESS_THAN_SIGN);
                     break;
               }
               break;
            case State.END_TAG_OPEN:
               // Consume the next input character.
               if (char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z') {
                  // Create a new end tag token, set its tag name to the the current input character,
                  // then switch to the tag name state. (Don't emit the token yet;
                  // further details will be filled in before it is emitted.)
                  this.state = State.TAG_NAME;
                  this.endTag = true;
                  this.cleanCharBuffer();
                  this.appendCharBuffer(char);
                  break;
               }
               switch (char) {
                  case Characters.GREATER_THAN_SIGN:
                     // Parse error. Switch to the data state.
                     this.state = State.DATA;
                     this.warn(`Некорректный символ < в "${this.charBuffer + char}". Возможная причина: символ < не был экранирован (как &lt;)`);
                     break;
                  case Characters.NULL:
                     // Parse error. Emit a REPLACEMENT CHARACTER character as a character token.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Parse error. Switch to the bogus comment state.
                     this.state = State.BOGUS_COMMENT;
                     this.warn(`Обнаружен мусор в тексте "${this.charBuffer + char}"`);
                     this.cleanCharBuffer();
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.TAG_NAME:
               // Consume the next input character.
               switch (char) {
                  case Characters.CHARACTER_TABULATION:
                  case Characters.LINE_FEED:
                  case Characters.FORM_FEED:
                  case Characters.SPACE:
                     // Switch to the before attribute name state.
                     this.state = State.BEFORE_ATTRIBUTE_NAME;
                     this.charBufferToTagName();
                     break;
                  case Characters.SOLIDUS:
                     // Switch to the self-closing start tag state.
                     this.state = State.SELF_CLOSING_START_TAG;
                     this.charBufferToTagName();
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Switch to the data state. Emit the current tag token.
                     this.state = State.DATA;
                     this.charBufferToTagName();
                     this.emitTagToken();
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character to the current tag token's tag name.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Append the current input character to the current tag token's tag name.
                     if (isValidNameCharacter(char)) {
                        this.appendCharBuffer(char);
                     } else {
                        this.warn(`Обнаружен некорректный символ "${char}" в имени тега "${this.charBuffer}"`);
                        this.charBufferToTagName();
                        this.state = State.BEFORE_ATTRIBUTE_NAME;
                     }
                     break;
               }
               break;
            case State.BEFORE_ATTRIBUTE_NAME:
               // Consume the next input character.
               switch (char) {
                  case Characters.CHARACTER_TABULATION:
                  case Characters.LINE_FEED:
                  case Characters.FORM_FEED:
                  case Characters.SPACE:
                     // Ignore the character.
                     break;
                  case Characters.SOLIDUS:
                     // Switch to the self-closing start tag state.
                     this.state = State.SELF_CLOSING_START_TAG;
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Switch to the data state. Emit the current tag token.
                     this.state = State.DATA;
                     this.emitTagToken();
                     break;
                  case Characters.NULL:
                     // Parse error. Start a new attribute in the current tag token.
                     // Set that attribute's name to a REPLACEMENT CHARACTER character,
                     // and its value to the empty string.
                     // Switch to the attribute name state.
                     this.state = State.ATTRIBUTE_NAME;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     this.commitPosition();
                     break;
                  case Characters.QUOTATION_MARK:
                  case Characters.APOSTROPHE:
                  case Characters.LESS_THAN_SIGN:
                  case Characters.EQUALS_SIGN:
                     // Parse error. Treat it as per the "anything else" entry below.
                     this.error(`Некорректный символ "${char}" в имени атрибута`);
                  // fallthrough
                  default:
                     // Start a new attribute in the current tag token.
                     // Set that attribute's name to the current input character,
                     // and its value to the empty string.
                     // Switch to the attribute name state.
                     this.state = State.ATTRIBUTE_NAME;
                     this.cleanCharBuffer();
                     this.appendCharBuffer(char);
                     this.commitPosition();
                     break;
               }
               break;
            case State.ATTRIBUTE_NAME:
               // Consume the next input character.
               switch (char) {
                  case Characters.CHARACTER_TABULATION:
                  case Characters.LINE_FEED:
                  case Characters.FORM_FEED:
                  case Characters.SPACE:
                     // Switch to the after attribute name state.
                     this.state = State.AFTER_ATTRIBUTE_NAME;
                     this.completeAttributeName();
                     break;
                  case Characters.SOLIDUS:
                     // Switch to the self-closing start tag state.
                     this.state = State.SELF_CLOSING_START_TAG;
                     this.completeAttributeName();
                     this.addAttributeWithoutValue();
                     break;
                  case Characters.EQUALS_SIGN:
                     // Switch to the before attribute value state.
                     this.state = State.BEFORE_ATTRIBUTE_VALUE;
                     this.completeAttributeName();
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Switch to the data state. Emit the current tag token.
                     this.state = State.DATA;
                     this.completeAttributeName();
                     this.addAttributeWithoutValue();
                     this.emitTagToken();
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character to the current attribute's name.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  case Characters.QUOTATION_MARK:
                  case Characters.APOSTROPHE:
                  case Characters.LESS_THAN_SIGN:
                     // Parse error. Treat it as per the "anything else" entry below.
                     this.warn(`Обнаружен некорректный символ "${char}" в имени атрибута`);
                  // fallthrough
                  default:
                     // Append the current input character to the current attribute's name.
                     this.appendCharBuffer(char);
                     break;
               }
               // When the user agent leaves the attribute name state (and before emitting the tag token,
               // if appropriate), the complete attribute's name must be compared to the other attributes
               // on the same token; if there is already an attribute on the token with the exact same name,
               // then this is a parse error and the new attribute must be dropped,
               // along with the value that gets associated with it (if any).
               break;
            case State.AFTER_ATTRIBUTE_NAME:
               // Consume the next input character.
               switch (char) {
                  case Characters.CHARACTER_TABULATION:
                  case Characters.LINE_FEED:
                  case Characters.FORM_FEED:
                  case Characters.SPACE:
                     // Ignore the character.
                     break;
                  case Characters.SOLIDUS:
                     // Switch to the self-closing start tag state.
                     this.state = State.SELF_CLOSING_START_TAG;
                     this.addAttributeWithoutValue();
                     break;
                  case Characters.EQUALS_SIGN:
                     // Switch to the before attribute value state.
                     this.state = State.BEFORE_ATTRIBUTE_VALUE;
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Switch to the data state. Emit the current tag token.
                     this.state = State.DATA;
                     this.addAttributeWithoutValue();
                     this.emitTagToken();
                     break;
                  case Characters.NULL:
                     // Parse error. Start a new attribute in the current tag token.
                     // Set that attribute's name to a REPLACEMENT CHARACTER character,
                     // and its value to the empty string.
                     // Switch to the attribute name state.
                     this.state = State.ATTRIBUTE_NAME;
                     this.flushCharBuffer();
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  case Characters.QUOTATION_MARK:
                  case Characters.APOSTROPHE:
                  case Characters.LESS_THAN_SIGN:
                     // Parse error. Treat it as per the "anything else" entry below.
                     this.error(`Некорректный символ "${char}" в имени атрибута`);
                  // fallthrough
                  default:
                     // Start a new attribute in the current tag token.
                     // Set that attribute's name to the current input character,
                     // and its value to the empty string.
                     // Switch to the attribute name state.
                     this.state = State.ATTRIBUTE_NAME;
                     this.addAttributeWithoutValue();
                     this.cleanCharBuffer();
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.BEFORE_ATTRIBUTE_VALUE:
               // Consume the next input character.
               switch (char) {
                  case Characters.CHARACTER_TABULATION:
                  case Characters.LINE_FEED:
                  case Characters.FORM_FEED:
                  case Characters.SPACE:
                     // Ignore the character.
                     break;
                  case Characters.QUOTATION_MARK:
                     // Switch to the attribute value (double-quoted) state.
                     this.state = State.ATTRIBUTE_VALUE_DOUBLE_QUOTED;
                     this.cleanCharBuffer();
                     break;
                  case Characters.AMPERSAND:
                     // Switch to the attribute value (unquoted) state and reconsume this current input character.
                     this.state = State.ATTRIBUTE_VALUE_UNQUOTED;
                     this.cleanCharBuffer();
                     reader.reconsume();
                     break;
                  case Characters.APOSTROPHE:
                     // Switch to the attribute value (single-quoted) state.
                     this.state = State.ATTRIBUTE_VALUE_SINGLE_QUOTED;
                     this.cleanCharBuffer();
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character to the current attribute's value.
                     // Switch to the attribute value (unquoted) state.
                     this.state = State.ATTRIBUTE_VALUE_UNQUOTED;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Parse error. Switch to the data state. Emit the current tag token.
                     this.state = State.DATA;
                     this.addAttributeWithoutValue();
                     this.emitTagToken();
                     break;
                  case Characters.LESS_THAN_SIGN:
                  case Characters.EQUALS_SIGN:
                  case Characters.GRAVE_ACCENT:
                     // Parse error. Treat it as per the "anything else" entry below.
                     this.error(`Некорректный символ "${char}" в начале значения unquoted-атрибута`);
                  // fallthrough
                  default:
                     // Append the current input character to the current attribute's value.
                     // Switch to the attribute value (unquoted) state.
                     this.state = State.ATTRIBUTE_VALUE_UNQUOTED;
                     this.cleanCharBuffer();
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.ATTRIBUTE_VALUE_DOUBLE_QUOTED:
               // Consume the next input character.
               switch (char) {
                  case Characters.QUOTATION_MARK:
                     // Switch to the after attribute value (quoted) state.
                     this.state = State.AFTER_ATTRIBUTE_VALUE_QUOTED;
                     this.addAttributeWithValue();
                     break;
                  case Characters.AMPERSAND:
                     // Switch to the character reference in attribute value state,
                     // with the additional allowed character being QUOTATION MARK (").
                     // TODO: release
                     this.appendCharBuffer(char);
                     // this.appendReferenceBuffer(char);
                     // this.setAdditionalCharacter(Characters.QUOTATION_MARK);
                     // this.returnState = this.state;
                     // this.state = State.CHARACTER_REFERENCE;
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character to the current attribute's value.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  case Characters.LEFT_CURLY_BRACKET:
                     // Switch to the special Wasaby state for mustache-expression.
                     // Emit the current input character as a character token.
                     this.returnState = this.state;
                     this.returnExpressionCharacter = '"';
                     this.state = State.BEFORE_EXPRESSION;
                     this.appendCharBuffer(char);
                     break;
                  default:
                     // Append the current input character to the current attribute's value.
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.ATTRIBUTE_VALUE_SINGLE_QUOTED:
               // Consume the next input character.
               switch (char) {
                  case Characters.APOSTROPHE:
                     // Switch to the after attribute value (quoted) state.
                     this.state = State.AFTER_ATTRIBUTE_VALUE_QUOTED;
                     this.addAttributeWithValue();
                     break;
                  case Characters.AMPERSAND:
                     // Switch to the character reference in attribute value state,
                     // with the additional allowed character being APOSTROPHE (').
                     // TODO: release
                     this.appendCharBuffer(char);
                     // this.appendReferenceBuffer(char);
                     // this.setAdditionalCharacter(Characters.APOSTROPHE);
                     // this.returnState = this.state;
                     // this.state = State.CHARACTER_REFERENCE;
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character to the current attribute's value.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  case Characters.LEFT_CURLY_BRACKET:
                     // Switch to the special Wasaby state for mustache-expression.
                     // Emit the current input character as a character token.
                     this.appendCharBuffer(char);
                     this.returnState = this.state;
                     this.returnExpressionCharacter = "'";
                     this.state = State.BEFORE_EXPRESSION;
                     break;
                  default:
                     // Append the current input character to the current attribute's value.
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.ATTRIBUTE_VALUE_UNQUOTED:
               // Consume the next input character.
               switch (char) {
                  case Characters.CHARACTER_TABULATION:
                  case Characters.LINE_FEED:
                  case Characters.FORM_FEED:
                  case Characters.SPACE:
                     // Switch to the before attribute name state.
                     this.state = State.BEFORE_ATTRIBUTE_NAME;
                     this.addAttributeWithValue();
                     break;
                  case Characters.AMPERSAND:
                     // Switch to the character reference in attribute value state,
                     // with the additional allowed character being APOSTROPHE (').
                     // TODO: release
                     // this.returnState = this.state;
                     // this.state = State.CHARACTER_REFERENCE;
                     this.appendCharBuffer(char);
                     // this.appendReferenceBuffer(char);
                     // this.setAdditionalCharacter(Characters.GREATER_THAN_SIGN);
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Switch to the data state. Emit the current tag token.
                     this.state = State.DATA;
                     this.addAttributeWithValue();
                     this.emitTagToken();
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character to the current attribute's value.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  case Characters.QUOTATION_MARK:
                  case Characters.APOSTROPHE:
                  case Characters.LESS_THAN_SIGN:
                  case Characters.EQUALS_SIGN:
                  case Characters.GRAVE_ACCENT:
                     // Parse error. Treat it as per the "anything else" entry below.
                     this.error(`Некорректный символ "${char}" в начале значения unquoted-атрибута`);
                  // fallthrough
                  default:
                     // Append the current input character to the current attribute's value.
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.AFTER_ATTRIBUTE_VALUE_QUOTED:
               // Consume the next input character.
               switch (char) {
                  case Characters.CHARACTER_TABULATION:
                  case Characters.LINE_FEED:
                  case Characters.FORM_FEED:
                  case Characters.SPACE:
                     // Switch to the before attribute name state.
                     this.state = State.BEFORE_ATTRIBUTE_NAME;
                     break;
                  case Characters.SOLIDUS:
                     // Switch to the self-closing start tag state.
                     this.state = State.SELF_CLOSING_START_TAG;
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Switch to the data state. Emit the current tag token.
                     this.state = State.DATA;
                     this.emitTagToken();
                     break;
                  default:
                     // Parse error. Reconsume the character in the before attribute name state.
                     this.state = State.BEFORE_ATTRIBUTE_NAME;
                     this.warn('Атрибуты не разделены пробелом');
                     reader.reconsume();
                     break;
               }
               break;
            case State.SELF_CLOSING_START_TAG:
               // Consume the next input character.
               switch (char) {
                  case Characters.GREATER_THAN_SIGN:
                     // Set the self-closing flag of the current tag token.
                     // Switch to the data state. Emit the current tag token.
                     this.state = State.DATA;
                     this.selfClosing = true;
                     this.emitTagToken();
                     break;
                  default:
                     // Parse error. Reconsume the character in the before attribute name state.
                     this.warn('В закрывающем теге после символа "/" сразу должен следовать символ >');
                     this.state = State.BEFORE_ATTRIBUTE_NAME;
                     reader.reconsume();
                     break;
               }
               break;
            case State.BOGUS_COMMENT:
            case State.BOGUS_COMMENT_HYPHEN:
               // Consume every character up to and including the first GREATER-THAN SIGN character (>)
               // or the end of the file (EOF), whichever comes first.
               // Emit a comment token whose data is the concatenation of all the characters starting from
               // and including the character that caused the state machine to switch into the bogus comment state,
               // up to and including the character immediately before the last consumed character
               // (i.e. up to the character just before the GREATER-THAN SIGN or EOF character),
               // but with any NULL characters replaced by REPLACEMENT CHARACTER characters.
               // (If the comment was started by the end of the file (EOF), the token is empty.)
               // Switch to the data state.
               // If the end of the file was reached, reconsume the EOF character.
               switch (char) {
                  case Characters.GREATER_THAN_SIGN:
                     this.state = State.DATA;
                     this.emitComment(0);
                     break;
                  case Characters.HYPHEN_MINUS:
                     this.state = State.BOGUS_COMMENT_HYPHEN;
                     this.appendCharBuffer(char);
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character to the current attribute's value.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.MARKUP_DECLARATION_OPEN:
               // If the next two characters are both HYPHEN-MINUS characters (-),
               // consume those two characters, create a comment token whose data is the empty string,
               // and switch to the comment start state.
               // Otherwise, if the next seven characters are an ASCII case-insensitive match for the word "DOCTYPE",
               // then consume those characters and switch to the DOCTYPE state.
               // Otherwise, if the current node is not an element in the HTML namespace and
               // the next seven characters are an case-sensitive match for the string "[CDATA["
               // (the five uppercase letters "CDATA" with a LEFT SQUARE BRACKET character before and after),
               // then consume those characters and switch to the CDATA section state.
               // Otherwise, this is a parse error. Switch to the bogus comment state.
               // The next character that is consumed, if any, is the first character that will be in the comment.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     this.state = State.MARKUP_DECLARATION_HYPHEN;
                     this.cleanCharBuffer();
                     break;
                  case 'd':
                  case 'D':
                     this.state = State.MARKUP_DECLARATION_OCTYPE;
                     this.index = 0;
                     this.cleanCharBuffer();
                     break;
                  case Characters.LEFT_SQUARE_BRACKET:
                     if (this.isCDATAAllowed()) {
                        this.state = State.CDATA_START;
                        this.index = 0;
                        this.cleanCharBuffer();
                        break;
                     }
                  // fallthrough
                  default:
                     this.state = State.BOGUS_COMMENT;
                     this.cleanCharBuffer();
                     reader.reconsume();
                     break;
               }
               break;
            case State.MARKUP_DECLARATION_HYPHEN:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     this.state = State.COMMENT_START;
                     break;
                  default:
                     this.state = State.BOGUS_COMMENT;
                     reader.reconsume();
                     break;
               }
               break;
            case State.MARKUP_DECLARATION_OCTYPE:
               // Consume the next input character.
               if (this.index < DOCTYPE.length) {
                  char = char.toUpperCase();
                  if (char === DOCTYPE[this.index]) {
                     this.index++;
                  } else {
                     this.state = State.BOGUS_COMMENT;
                     reader.reconsume();
                  }
               } else {
                  this.state = State.DOCTYPE;
                  this.index = Number.MAX_VALUE;
               }
               break;
            case State.COMMENT_START:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Switch to the comment start dash state.
                     this.state = State.COMMENT_START_DASH;
                     this.appendCharBuffer(char);
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character to the comment token's data.
                     // Switch to the comment state.
                     this.state = State.COMMENT;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Parse error. Switch to the data state. Emit the comment token.
                     this.state = State.DATA;
                     this.warn(
                        'Некорректное завершение комментария. Для закрытия комментария следует использовать "-->"'
                     );
                     this.emitComment(0);
                     break;
                  default:
                     // Append the current input character to the comment token's data. Switch to the comment state.
                     this.state = State.COMMENT;
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.COMMENT_START_DASH:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Switch to the comment end state
                     this.state = State.COMMENT_END;
                     this.appendCharBuffer(char);
                     break;
                  case Characters.NULL:
                     // Parse error. Append a HYPHEN-MINUS character
                     // and a REPLACEMENT CHARACTER character to the comment token's data.
                     // Switch to the comment state.
                     this.state = State.COMMENT;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Parse error. Switch to the data state. Emit the comment token.
                     this.state = State.DATA;
                     this.warn(
                        'Некорректное завершение комментария. Для закрытия комментария следует использовать "-->"'
                     );
                     this.emitComment(1);
                     break;
                  default:
                     // Append a HYPHEN-MINUS character (-)
                     // and the current input character to the comment token's data.
                     // Switch to the comment state.
                     this.appendCharBuffer(char);
                     this.state = State.COMMENT;
                     break;
               }
               break;
            case State.COMMENT:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Switch to the comment end dash state
                     this.state = State.COMMENT_END_DASH;
                     this.appendCharBuffer(char);
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character to the comment token's data.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Append the current input character to the comment token's data.
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.COMMENT_END_DASH:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Switch to the comment end state
                     this.state = State.COMMENT_END;
                     this.appendCharBuffer(char);
                     break;
                  case Characters.NULL:
                     // Parse error. Append a HYPHEN-MINUS character
                     // and a REPLACEMENT CHARACTER character to the comment token's data.
                     // Switch to the comment state.
                     this.state = State.COMMENT;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Append a HYPHEN-MINUS character
                     // and the current input character to the comment token's data.
                     // Switch to the comment state.
                     this.state = State.COMMENT;
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.COMMENT_END:
               // Consume the next input character.
               switch (char) {
                  case Characters.GREATER_THAN_SIGN:
                     // Switch to the data state. Emit the comment token.
                     this.state = State.DATA;
                     this.emitComment(2);
                     break;
                  case Characters.NULL:
                     // Parse error. Append two HYPHEN-MINUS characters
                     // and a REPLACEMENT CHARACTER character to the comment token's data.
                     // Switch to the comment state.
                     this.state = State.COMMENT;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  case Characters.EXCLAMATION_MARK:
                     // Parse error. Switch to the comment end bang state.
                     this.state = State.COMMENT_END_BANG;
                     this.appendCharBuffer(char);
                     break;
                  case Characters.HYPHEN_MINUS:
                     // Parse error. Append a HYPHEN-MINUS character to the comment token's data.
                     this.appendCharBuffer(char);
                     break;
                  default:
                     // Parse error. Append two HYPHEN-MINUS characters
                     // and the current input character to the comment token's data.
                     // Switch to the comment state.
                     this.state = State.COMMENT;
                     this.appendCharBuffer('--');
                     this.appendCharBuffer(char);
                     reader.reconsume();
                     break;
               }
               break;
            case State.COMMENT_END_BANG:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Append two HYPHEN-MINUS characters
                     // and a EXCLAMATION MARK character to the comment token's data.
                     // Switch to the comment end dash state.
                     this.state = State.COMMENT_END_DASH;
                     this.appendCharBuffer(char);
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Emit the comment token.
                     this.state = State.DATA;
                     this.emitComment(3);
                     break;
                  case Characters.NULL:
                     // Parse error. Append two HYPHEN-MINUS characters,
                     // a EXCLAMATION MARK character,
                     // and a REPLACEMENT CHARACTER character to the comment token's data.
                     // Switch to the comment state.
                     this.state = State.COMMENT;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Append two HYPHEN-MINUS characters,
                     // a EXCLAMATION MARK character,
                     // and the current input character to the comment token's data.
                     // Switch to the comment state.
                     this.state = State.COMMENT;
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.DOCTYPE:
               // Consume the next input character.
               switch (char) {
                  case Characters.GREATER_THAN_SIGN:
                     // Switch to the data state. Emit the current DOCTYPE token.
                     this.state = State.DATA;
                     this.emitDoctype();
                     break;
                  default:
                     // Append the current input character.
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.CDATA_START:
               if (this.index < CDATA.length) {
                  char = char.toUpperCase();
                  if (char === CDATA[this.index]) {
                     this.index++;
                  } else {
                     this.state = State.BOGUS_COMMENT;
                     reader.reconsume();
                  }
               } else {
                  this.state = State.CDATA_SECTION;
                  this.index = Number.MAX_VALUE;
                  reader.reconsume();
                  this.commitPosition();
               }
               break;
            case State.CDATA_SECTION:
               // Consume every character up to the next occurrence of the three character sequence
               // RIGHT SQUARE BRACKET
               // RIGHT SQUARE BRACKET
               // GREATER-THAN SIGN (]]>), or the end of the file (EOF), whichever comes first.
               // Emit a series of character tokens consisting of all the characters consumed
               // except the matching three character sequence at the end
               // (if one was found before the end of the file).
               // Switch to the data state.
               // If the end of the file was reached, reconsume the EOF character.
               switch (char) {
                  case Characters.RIGHT_SQUARE_BRACKET:
                     this.state = State.CDATA_RSQB;
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character
                     // to the current DOCTYPE token's system identifier.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.CDATA_RSQB:
               // Consume the next input character.
               switch (char) {
                  case Characters.RIGHT_SQUARE_BRACKET:
                     this.state = State.CDATA_RSQB_RSQB;
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character
                     // to the current DOCTYPE token's system identifier.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     this.state = State.CDATA_SECTION;
                     this.appendCharBuffer(Characters.RIGHT_SQUARE_BRACKET);
                     reader.reconsume();
                     break;
               }
               break;
            case State.CDATA_RSQB_RSQB:
               // Consume the next input character.
               switch (char) {
                  case Characters.GREATER_THAN_SIGN:
                     this.state = State.DATA;
                     this.emitCDATA();
                     break;
                  case Characters.NULL:
                     // Parse error. Append a REPLACEMENT CHARACTER character
                     // to the current DOCTYPE token's system identifier.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     this.state = State.CDATA_SECTION;
                     this.appendCharBuffer(Characters.RIGHT_SQUARE_BRACKET);
                     this.appendCharBuffer(Characters.RIGHT_SQUARE_BRACKET);
                     reader.reconsume();
                     break;
               }
               break;
            case State.INSTRUCTION:
               this.appendCharBuffer(char);
               if (char === Characters.QUESTION_MARK) {
                  this.state = State.INSTRUCTION_QUESTION_MARK;
               }
               break;
            case State.INSTRUCTION_QUESTION_MARK:
               switch (char) {
                  case Characters.GREATER_THAN_SIGN:
                     this.state = State.DATA;
                     this.emitInstruction();
                     break;
                  default:
                     this.state = State.INSTRUCTION;
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.RAW_TEXT:
               // Consume the next input character.
               switch (char) {
                  case Characters.LESS_THAN_SIGN:
                     this.returnState = this.state;
                     this.state = State.RAW_TEXT_LESS_THAN_SIGN;
                     this.flushCharBuffer();
                     break;
                  case Characters.NULL:
                     // Parse error. Emit a REPLACEMENT CHARACTER character token.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Emit the current input character as a character token.
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.RAW_TEXT_LESS_THAN_SIGN:
               // Consume the next input character.
               switch (char) {
                  case Characters.SOLIDUS:
                     // Set the temporary buffer to the empty string.
                     // Switch to the raw text end tag open state.
                     this.state = State.ESCAPABLE_RAW_TEXT_END_TAG_NAME;
                     this.index = 0;
                     this.cleanCharBuffer();
                     break;
                  case Characters.EXCLAMATION_MARK:
                     // Switch to the raw text escape start state.
                     // Emit a LESS-THAN SIGN character token
                     // and a EXCLAMATION MARK character token.
                     this.state = State.RAW_TEXT_ESCAPE_START;
                     this.appendCharBuffer(Characters.LESS_THAN_SIGN);
                     break;
                  default:
                     // Emit a LESS-THAN SIGN character token
                     // and reconsume the current input character in the raw text state.
                     this.state = State.RAW_TEXT;
                     this.appendCharBuffer(Characters.LESS_THAN_SIGN);
                     reader.reconsume();
                     break;
               }
               break;
            case State.RAW_TEXT_ESCAPE_START:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Switch to the raw text escape start dash state.
                     // Emit a HYPHEN-MINUS character token.
                     this.state = State.RAW_TEXT_ESCAPE_START_DASH;
                     break;
                  default:
                     // Reconsume the current input character in the raw text state.
                     this.state = State.RAW_TEXT;
                     reader.reconsume();
                     break;
               }
               break;
            case State.RAW_TEXT_ESCAPE_START_DASH:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Switch to the raw text escaped dash dash state.
                     // Emit a HYPHEN-MINUS character token.
                     this.state = State.RAW_TEXT_ESCAPED_DASH_DASH;
                     break;
                  default:
                     // Reconsume the current input character in the raw text state.
                     this.state = State.RAW_TEXT;
                     reader.reconsume();
                     break;
               }
               break;
            case State.RAW_TEXT_ESCAPED:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Switch to the raw text escaped dash state.
                     // Emit a HYPHEN-MINUS character token.
                     this.state = State.RAW_TEXT_ESCAPED_DASH;
                     break;
                  case Characters.LESS_THAN_SIGN:
                     this.state = State.RAW_TEXT_DOUBLE_ESCAPED_LESS_THAN_SIGN;
                     break;
                  case Characters.NULL:
                     // Parse error. Switch to the raw text escaped state.
                     // Emit a REPLACEMENT CHARACTER character token.
                     this.state = State.RAW_TEXT_ESCAPED;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Switch to the raw text escaped state.
                     // Emit the current input character as a character token.
                     this.state = State.RAW_TEXT_ESCAPED;
                     break;
               }
               break;
            case State.RAW_TEXT_ESCAPED_DASH:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Emit a HYPHEN-MINUS character token.
                     this.state = State.RAW_TEXT_ESCAPED_DASH_DASH;
                     break;
                  case Characters.LESS_THAN_SIGN:
                     // Switch to the raw text escaped less-than sign state.
                     this.state = State.RAW_TEXT_ESCAPED_LESS_THAN_SIGN;
                     break;
                  case Characters.NULL:
                     // Parse error. Switch to the raw text escaped state.
                     // Emit a REPLACEMENT CHARACTER character token.
                     this.state = State.RAW_TEXT_ESCAPED;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Switch to the raw text escaped state.
                     // Emit the current input character as a character token.
                     this.state = State.RAW_TEXT_ESCAPED;
                     break;
               }
               break;
            case State.RAW_TEXT_ESCAPED_DASH_DASH:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Emit a HYPHEN-MINUS character token.
                     break;
                  case Characters.LESS_THAN_SIGN:
                     // Switch to the raw text escaped less-than sign state.
                     this.state = State.RAW_TEXT_ESCAPED_LESS_THAN_SIGN;
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Switch to the raw text state.
                     // Emit a GREATER-THAN SIGN character token.
                     this.state = State.RAW_TEXT;
                     break;
                  case Characters.NULL:
                     // Parse error. Switch to the raw text escaped state.
                     // Emit a REPLACEMENT CHARACTER character token.
                     this.state = State.RAW_TEXT_ESCAPED;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Switch to the raw text escaped state.
                     // Emit the current input character as a character token.
                     this.state = State.RAW_TEXT_ESCAPED;
                     break;
               }
               break;
            case State.RAW_TEXT_ESCAPED_LESS_THAN_SIGN:
               // Consume the next input character.
               if (char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z') {
                  // Set the temporary buffer to the empty string.
                  // Append the current input character to the temporary buffer.
                  // Switch to the raw text double escape start state.
                  // Emit a LESS-THAN SIGN character token
                  // and the current input character as a character token.
                  this.state = State.RAW_TEXT_DOUBLE_ESCAPE_START;
                  break;
               }
               switch (char) {
                  case Characters.SOLIDUS:
                     // Set the temporary buffer to the empty string.
                     // Switch to the raw text escaped end tag open state.
                     this.returnState = State.RAW_TEXT_ESCAPED;
                     this.state = State.RAW_TEXT_ESCAPED_END_TAG_OPEN;
                     break;
                  default:
                     // Emit a LESS-THAN SIGN character token
                     // and reconsume the current input character in the raw text escaped state.
                     this.state = State.RAW_TEXT_ESCAPED;
                     reader.reconsume();
                     break;
               }
               break;
            case State.RAW_TEXT_ESCAPED_END_TAG_OPEN:
               // Consume the next input character.
               if (char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z') {
                  // Create a new end tag token, and set its tag name to the current input character.
                  // Append the current input character to the temporary buffer.
                  // Finally, switch to the raw text escaped end tag name state.
                  // (Don't emit the token yet; further details will be filled in before it is emitted.)
                  this.state = State.RAW_TEXT_ESCAPED_END_TAG_NAME;
                  break;
               } else {
                  // Emit a LESS-THAN SIGN character token, a SOLIDUS character token,
                  // and reconsume the current input character in the raw text escaped state.
                  this.state = State.RAW_TEXT_ESCAPED;
                  reader.reconsume();
               }
               break;
            case State.RAW_TEXT_ESCAPED_END_TAG_NAME:
               // Consume the next input character.
               if (char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z') {
                  // Append the current input character to the current tag token's tag name.
                  // Append the current input character to the temporary buffer.
                  this.state = State.RAW_TEXT_ESCAPED_END_TAG_NAME;
                  this.appendCharBuffer(char);
                  break;
               }
               treatAsDefault = false;
               switch (char) {
                  case Characters.CHARACTER_TABULATION:
                  case Characters.LINE_FEED:
                  case Characters.FORM_FEED:
                  case Characters.SPACE:
                     // If the current end tag token is an appropriate end tag token,
                     // then switch to the before attribute name state.
                     // Otherwise, treat it as per the "anything else" entry below.
                     if (this.charBuffer.toUpperCase() === this.expectingEndTagName) {
                        this.state = State.BEFORE_ATTRIBUTE_NAME;
                        break;
                     }
                     treatAsDefault = true;
                     break;
                  case Characters.SOLIDUS:
                     // If the current end tag token is an appropriate end tag token,
                     // then switch to the self-closing start tag state.
                     // Otherwise, treat it as per the "anything else" entry below.
                     if (this.charBuffer.toUpperCase() === this.expectingEndTagName)  {
                        this.state = State.SELF_CLOSING_START_TAG;
                        break;
                     }
                     treatAsDefault = true;
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // If the current end tag token is an appropriate end tag token,
                     // then emit the current tag token and switch to the data state.
                     // Otherwise, treat it as per the "anything else" entry below.
                     if (this.charBuffer.toUpperCase() === this.expectingEndTagName)  {
                        this.state = State.DATA;
                        break;
                     }
                     treatAsDefault = true;
                     break;
                  default:
                     treatAsDefault = true;
                     break;
               }
               if (treatAsDefault) {
                  // Emit a LESS-THAN SIGN character token, a SOLIDUS character token,
                  // a character token for each of the characters in the temporary buffer
                  // (in the order they were added to the buffer),
                  // and reconsume the current input character in the raw text escaped state.
                  reader.reconsume();
                  this.state = State.RAW_TEXT_ESCAPED;
               }
               break;
            case State.RAW_TEXT_DOUBLE_ESCAPE_START:
               this.processRawText(char, reader, State.RAW_TEXT_DOUBLE_ESCAPED, State.RAW_TEXT_ESCAPED);
               break;
            case State.RAW_TEXT_DOUBLE_ESCAPED:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Switch to the raw text double escaped dash state.
                     // Emit a HYPHEN-MINUS character token.
                     this.state = State.RAW_TEXT_DOUBLE_ESCAPED_DASH;
                     break;
                  case Characters.LESS_THAN_SIGN:
                     // Switch to the raw text double escaped less-than sign state.
                     // Emit a LESS-THAN SIGN character token.
                     this.state = State.RAW_TEXT_DOUBLE_ESCAPED_LESS_THAN_SIGN;
                     break;
                  case Characters.NULL:
                     // Parse error. Emit a REPLACEMENT CHARACTER character token.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Emit the current input character as a character token.
                     break;
               }
               break;
            case State.RAW_TEXT_DOUBLE_ESCAPED_DASH:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Switch to the raw text double escaped dash dash state.
                     // Emit a HYPHEN-MINUS character token.
                     this.state = State.RAW_TEXT_DATA_DOUBLE_ESCAPED_DASH_DASH;
                     break;
                  case Characters.LESS_THAN_SIGN:
                     // Switch to the raw text double escaped less-than sign state.
                     // Emit a LESS-THAN SIGN character token.
                     this.state = State.RAW_TEXT_DOUBLE_ESCAPED_LESS_THAN_SIGN;
                     break;
                  case Characters.NULL:
                     // Parse error. Switch to the raw text double escaped state.
                     // Emit a REPLACEMENT CHARACTER character token.
                     this.state = State.RAW_TEXT_DOUBLE_ESCAPED;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Switch to the raw text double escaped state.
                     // Emit the current input character as a character token.
                     this.state = State.RAW_TEXT_DOUBLE_ESCAPED;
                     break;
               }
               break;
            case State.RAW_TEXT_DATA_DOUBLE_ESCAPED_DASH_DASH:
               // Consume the next input character.
               switch (char) {
                  case Characters.HYPHEN_MINUS:
                     // Emit a HYPHEN-MINUS character token.
                     break;
                  case Characters.LESS_THAN_SIGN:
                     // Switch to the raw text double escaped less-than sign state.
                     // Emit a LESS-THAN SIGN character token.
                     this.state = State.RAW_TEXT_DOUBLE_ESCAPED_LESS_THAN_SIGN;
                     break;
                  case Characters.GREATER_THAN_SIGN:
                     // Switch to the raw text state. Emit a GREATER-THAN SIGN character token.
                     this.state = State.RAW_TEXT;
                     break;
                  case Characters.NULL:
                     // Parse error. Switch to the raw text double escaped state.
                     // Emit a REPLACEMENT CHARACTER character token.
                     this.state = State.RAW_TEXT_DOUBLE_ESCAPED;
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Switch to the raw text double escaped state.
                     // Emit the current input character as a character token.
                     this.state = State.RAW_TEXT_DOUBLE_ESCAPED;
                     break;
               }
               break;
            case State.RAW_TEXT_DOUBLE_ESCAPED_LESS_THAN_SIGN:
               // Consume the next input character.
               switch (char) {
                  case Characters.SOLIDUS:
                     // Set the temporary buffer to the empty string.
                     // Switch to the raw text double escape end state.
                     // Emit a SOLIDUS character token.
                     this.state = State.RAW_TEXT_DOUBLE_ESCAPE_END;
                     this.index = 0;
                     break;
                  default:
                     // Reconsume the current input character in the raw text double escaped state.
                     this.state = State.RAW_TEXT_DOUBLE_ESCAPED;
                     reader.reconsume();
                     break;
               }
               break;
            case State.RAW_TEXT_DOUBLE_ESCAPE_END:
               this.processRawText(char, reader, State.RAW_TEXT_ESCAPED, State.RAW_TEXT_DOUBLE_ESCAPED);
               break;
            case State.ESCAPABLE_RAW_TEXT:
               // Consume the next input character.
               switch (char) {
                  case Characters.LESS_THAN_SIGN:
                     this.returnState = this.state;
                     this.state = State.ESCAPABLE_RAW_TEXT_LESS_THAN_SIGN;
                     this.flushCharBuffer();
                     break;
                  case Characters.NULL:
                     // Parse error. Emit a REPLACEMENT CHARACTER character token.
                     this.appendCharBuffer(Characters.NULL_REPLACEMENT);
                     break;
                  default:
                     // Emit the current input character as a character token.
                     this.appendCharBuffer(char);
                     break;
               }
               break;
            case State.ESCAPABLE_RAW_TEXT_LESS_THAN_SIGN:
               // Consume the next input character.
               switch (char) {
                  case Characters.SOLIDUS:
                     // Set the temporary buffer to the empty string.
                     this.state = State.ESCAPABLE_RAW_TEXT_END_TAG_NAME;
                     this.index = 0;
                     this.cleanCharBuffer();
                     break;
                  default:
                     // Emit a LESS-THAN SIGN character token
                     // and reconsume the current input character in the RCDATA state.
                     this.state = this.returnState;
                     this.appendCharBuffer(Characters.LESS_THAN_SIGN);
                     reader.reconsume();
                     break;
               }
               break;
            case State.ESCAPABLE_RAW_TEXT_END_TAG_NAME:
               // Consume the next input character.
               if (this.expectingEndTagName === null) {
                  this.state = this.returnState;
                  this.appendCharBuffer('</');
                  reader.reconsume();
                  break;
               } else if (this.index < this.expectingEndTagName.length) {
                  char = char.toLowerCase();
                  if (char !== this.expectingEndTagName[this.index]) {
                     this.state = this.returnState;
                     this.appendCharBuffer('</');
                     reader.reconsume();
                     break;
                  }
                  this.appendCharBuffer(char);
                  this.index++;
                  break;
               } else {
                  this.endTag = true;
                  this.tagName = this.expectingEndTagName;
                  this.expectingEndTagName = null;
                  switch (char) {
                     case Characters.LINE_FEED:
                     case Characters.SPACE:
                     case Characters.CHARACTER_TABULATION:
                        /*
                         * If the current end tag token is an
                         * appropriate end tag token, then switch to
                         * the before attribute name state.
                         */
                        this.state = State.BEFORE_ATTRIBUTE_NAME;
                        this.cleanCharBuffer();
                        break;
                     case '/':
                        /*
                         * If the current end tag
                         * token is an appropriate end tag token,
                         * then switch to the self-closing start tag
                         * state.
                         */
                        this.state = State.SELF_CLOSING_START_TAG;
                        this.cleanCharBuffer();
                        break;
                     case '>':
                        /*
                         * GREATER-THAN SIGN (>) If the
                         * current end tag token is an appropriate
                         * end tag token, then emit the current tag
                         * token and switch to the data state.
                         */
                        this.cleanCharBuffer();
                        this.state = State.DATA;
                        this.emitTagToken();
                        break;
                     default:
                        /*
                         * Emit a LESS-THAN SIGN character
                         * token, a SOLIDUS character token,
                         * a character token for each of the
                         * characters in the temporary buffer (in
                         * the order they were added to the buffer),
                         * and reconsume the current input character
                         * in the RAWTEXT state.
                         */
                        this.appendCharBuffer('</');
                        this.flushCharBuffer();
                        reader.reconsume();
                        break;
                  }
               }
               break;
         }
      }
      this.finalize();
   }

   private processRawText(char: string, reader: SourceReader, successState: State, failureState: State): void {
      // Consume the next input character.
      if (char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z') {
         // Append the current input character to the temporary buffer.
         // Emit the current input character as a character token.
         this.appendCharBuffer(char);
         return;
      }
      switch (char) {
         case Characters.CHARACTER_TABULATION:
         case Characters.LINE_FEED:
         case Characters.FORM_FEED:
         case Characters.SPACE:
         case Characters.SOLIDUS:
         case Characters.GREATER_THAN_SIGN:
            // If the temporary buffer is the string "script",
            // then switch to the raw text double escaped state.
            // Otherwise, switch to the sraw text escaped state.
            // Emit the current input character as a character token.
            if (this.index < this.expectingEndTagName.length) {
               char = char.toUpperCase();
               if (char === this.expectingEndTagName[this.index]) {
                  this.index++;
               } else {
                  this.state = failureState;
                  reader.reconsume();
               }
            } else {
               this.state = successState;
               this.index = Number.MAX_VALUE;
            }
            break;
         default:
            // Reconsume the current input character in the raw text escaped state.
            this.state = failureState;
            reader.reconsume();
            break;
      }
   }

   /**
    *
    * @param contentModel {ContentModel}
    * @param expectingEndTagName {string}
    */
   setContentModel(contentModel: ContentModel, expectingEndTagName: string): void {
      this.returnState = this.state;
      this.state = getStateByContentModel(contentModel);
      this.expectingEndTagName = expectingEndTagName;
   }

   /**
    *
    * @param char {string}
    */
   private appendCharBuffer(char: string): void {
      this.charBuffer += char;
   }

   /**
    *
    */
   private flushCharBuffer(): void {
      if (this.charBuffer.length > 0) {
         this.tokenHandler.onText(this.charBuffer, this.startPosition);
         this.cleanCharBuffer();
      }
   }

   /**
    *
    */
   private cleanCharBuffer(): void {
      this.charBuffer = '';
   }

   /**
    *
    */
   private charBufferToTagName(): void {
      this.tagName = this.charBuffer;
      this.cleanCharBuffer();
   }

   /**
    *
    */
   private emitTagToken(): void {
      if (this.endTag) {
         this.tokenHandler.onCloseTag(this.tagName as string, this.startPosition);
      } else {
         this.tokenHandler.onOpenTag(
            this.tagName as string,
            this.attributes || { },
            this.selfClosing,
            this.startPosition
         );
      }
      this.tagName = '';
      this.attributes = undefined;
      this.selfClosing = false;
   }

   /**
    *
    */
   private completeAttributeName(): void {
      this.attributeName = this.charBuffer;
      this.cleanCharBuffer();
      if (!this.attributes) {
         this.attributes = { };
      }
      if (!isValidName(this.attributeName)) {
         this.error(`Некорректное имя атрибута "${this.attributeName}" на теге "${this.tagName}". Данный атрибут будет отброшен`);
         this.attributeName = undefined;
         return;
      }
      if (this.attributes[this.attributeName]) {
         this.error(`Атрибут "${this.attributeName}" уже определен на теге "${this.tagName}"`);
         this.attributeName = undefined;
      }
   }

   /**
    *
    */
   private addAttributeWithoutValue(): void {
      if (this.attributes && this.attributeName) {
         this.attributes[this.attributeName] = new Attribute(this.attributeName, this.startPosition);
      }
      this.attributeName = undefined;
      this.cleanCharBuffer();
   }

   /**
    *
    */
   private addAttributeWithValue(): void {
      if (this.attributes && this.attributeName) {
         this.attributes[this.attributeName] = new Attribute(this.attributeName, this.startPosition);
         this.attributes[this.attributeName].value = this.charBuffer;
      }
      this.attributeName = undefined;
      this.cleanCharBuffer();
   }

   /**
    *
    * @param provisionalHyphens {number}
    */
   private emitComment(provisionalHyphens: number): void {
      const data = this.charBuffer.substr(0, this.charBuffer.length - provisionalHyphens);
      if (this.allowComments) {
         this.tokenHandler.onComment(data, this.startPosition);
      }
      this.cleanCharBuffer();
   }

   /**
    *
    */
   private isCDATAAllowed(): boolean {
      return this.allowCDATA;
   }

   /**
    *
    */
   private emitCDATA(): void {
      this.tokenHandler.onCDATA(this.charBuffer, this.startPosition);
      this.cleanCharBuffer();
   }

   /**
    *
    */
   private emitDoctype(): void {
      this.tokenHandler.onDoctype(this.charBuffer, this.startPosition);
      this.cleanCharBuffer();
   }

   private emitInstruction(): void {
      this.tokenHandler.onInstruction(this.charBuffer, this.startPosition);
      this.cleanCharBuffer();
   }

   /**
    *
    */
   private commitPosition(): void {
      this.startPosition = this.currentPosition;
   }

   /**
    *
    * @param message {string}
    */
   private error(message: string): void {
      this.errorHandler.error(message, {
         position: this.startPosition,
         fileName: this.fileName
      });
   }

   /**
    *
    * @param message {string}
    */
   private warn(message: string): void {
      this.errorHandler.warn(message, {
         position: this.startPosition,
         fileName: this.fileName
      });
   }

   /**
    *
    */
   private finalize(): void {
      switch (this.state) {
         case State.RAW_TEXT_LESS_THAN_SIGN:
         case State.RAW_TEXT_ESCAPED_LESS_THAN_SIGN:
            this.appendCharBuffer('<');
            break;
         case State.TAG_OPEN:
            this.error('Обнаружен конец файла после чтения символа <');
            this.appendCharBuffer('<');
            break;
         case State.ESCAPABLE_RAW_TEXT_LESS_THAN_SIGN:
            this.appendCharBuffer('<');
            break;
         case State.ESCAPABLE_RAW_TEXT_END_TAG_NAME:
            this.appendCharBuffer('<>');
            this.flushCharBuffer();
            break;
         case State.END_TAG_OPEN:
            this.error('Обнаружен конец файла после чтения символа <');
            this.appendCharBuffer('<>');
            break;
         case State.TAG_NAME:
            this.error('Во время чтения имени тега был достигнут конец файла. Данный тег будет отброшен');
            break;
         case State.BEFORE_ATTRIBUTE_NAME:
         case State.AFTER_ATTRIBUTE_VALUE_QUOTED:
         case State.SELF_CLOSING_START_TAG:
            this.error('Обнаружен конец файла при чтении тега. Данный тег будет отброшен');
            break;
         case State.ATTRIBUTE_NAME:
            this.error('Во время чтения имени атрибута был достигнут конец файла. Данный тег будет отброшен');
            break;
         case State.AFTER_ATTRIBUTE_NAME:
         case State.BEFORE_ATTRIBUTE_VALUE:
            this.error('Перед началом чтения значения атрибута был достигнут конец файла. Данный тег будет отброшен');
            break;
         case State.ATTRIBUTE_VALUE_DOUBLE_QUOTED:
         case State.ATTRIBUTE_VALUE_SINGLE_QUOTED:
         case State.ATTRIBUTE_VALUE_UNQUOTED:
            this.error('Во время чтения значения атрибута был достигнут конец файла. Данный тег будет отброшен');
            break;
         case State.BOGUS_COMMENT:
            this.emitComment(0);
            break;
         case State.BOGUS_COMMENT_HYPHEN:
            this.emitComment(0);
            break;
         case State.MARKUP_DECLARATION_OPEN:
         case State.MARKUP_DECLARATION_HYPHEN:
            this.emitComment(0);
            break;
         case State.MARKUP_DECLARATION_OCTYPE:
            if (this.index < 6) {
               this.emitComment(0);
            } else {
               this.error('Во время чтения конструкции doctype был достигнут конец файла');
               this.emitDoctype();
            }
            break;
         case State.COMMENT_START:
         case State.COMMENT:
            this.error('Во время чтения комментария был достигнут конец файла');
            this.emitComment(0);
            break;
         case State.COMMENT_END:
            this.error('Во время чтения комментария был достигнут конец файла');
            this.emitComment(2);
            break;
         case State.COMMENT_END_DASH:
         case State.COMMENT_START_DASH:
            this.error('Во время чтения комментария был достигнут конец файла');
            this.emitComment(1);
            break;
         case State.COMMENT_END_BANG:
            this.error('Во время чтения комментария был достигнут конец файла');
            this.emitComment(3);
            break;
         case State.DOCTYPE:
            this.error('Во время чтения конструкции doctype был достигнут конец файла');
            this.emitDoctype();
            break;
         case State.CDATA_RSQB:
            this.appendCharBuffer('<');
            break ;
         case State.CDATA_RSQB_RSQB:
            this.appendCharBuffer('<>');
            break;
         case State.DATA:
         default:
            break;
      }
      this.flushCharBuffer();
      this.tokenHandler.onEOF(this.currentPosition);
   }
}
