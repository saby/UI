define('UI/_builderConfig/Config', [], function() {

   /**
    * @author Крылов М.А.
    */

   return {
      /**
       * Типы узлов AST дерева, для которых не выполняется кодогенерация.
       */
      ignored: [
         'comment'
      ],
      /**
       * Префиксы контролов, точки которых не должны преобразовываться к слешам при замене.
       */
      mustBeDots: [
         'SBIS3.CONTROLS',
         'SBIS3.ENGINE'
      ],
      /**
       * Максимально возможная длина имени модуля или подключаемого шаблона
       */
      moduleMaxNameLength: 4096,
      /**
       * Список зарезервированных слов в JavaScript
       */
      reservedWords: [
         'abstract',
         'arguments',
         'await',
         'boolean',
         'break',
         'byte',
         'case',
         'catch',
         'char',
         'class',
         'const',
         'continue',
         'debugger',
         'default',
         'delete',
         'do',
         'double',
         'else',
         'enum',
         'eval',
         'export',
         'extends',
         'false',
         'final',
         'finally',
         'float',
         'for',
         'function',
         'goto',
         'if',
         'implements',
         'import',
         'in',
         'instanceof',
         'int',
         'interface',
         'let',
         'long',
         'native',
         'new',
         'null',
         'package',
         'private',
         'protected',
         'public',
         'return',
         'short',
         'static',
         'super',
         'switch',
         'synchronized',
         'this',
         'throw',
         'throws',
         'transient',
         'true',
         'try',
         'typeof',
         'var',
         'void',
         'volatile',
         'while',
         'with',
         'yield'
      ],
      /**
       * Атрибуты тегов логического типа.
       * Источник: https://github.com/iandevlin/html-attributes/blob/master/boolean-attributes.json
       */
      booleanAttributes: [
         'allowfullscreen',
         'allowpaymentrequest',
         'async',
         'autofocus',
         'autoplay',
         'checked',
         'contenteditable',
         'controls',
         'default',
         'defer',
         'disabled',
         'formnovalidate',
         'frameborder',
         'hidden',
         'ismap',
         'itemscope',
         'loop',
         'multiple',
         'muted',
         'nomodule',
         'novalidate',
         'open',
         'readonly',
         'required',
         'reversed',
         'selected',
         'typemustmatch'
      ]
   };
});
