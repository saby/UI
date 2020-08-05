/// <amd-module name="UI/_builder/Tmpl/html/ContentModel" />

/**
 * HTML Element content model.
 *
 * <b>Restrictions</b>
 *
 * The text in raw text and escapable raw text elements must not contain any occurrences
 * of the string "</" (U+003C LESS-THAN SIGN, U+002F SOLIDUS) followed by characters that case-insensitively
 * match the tag name of the element followed by one of U+0009 CHARACTER TABULATION (tab), U+000A LINE FEED (LF),
 * U+000C FORM FEED (FF), U+000D CARRIAGE RETURN (CR), U+0020 SPACE, U+003E GREATER-THAN SIGN (>), or U+002F SOLIDUS (/).
 *
 * @link https://www.w3.org/TR/2011/WD-html5-20110525/content-models.html
 *
 * @author Крылов М.А.
 */
export enum ContentModel {
   /**
    * Parsable data.
    */
   PARSABLE_DATA,

   /**
    * Raw text elements can have text, though it has restrictions below.
    */
   RAW_TEXT,

   /**
    * Escapable raw text elements can have text and character references,
    * but the text must not contain an ambiguous ampersand.
    * There are also further restrictions.
    */
   ESCAPABLE_RAW_TEXT
}
