define('UI/_builder/Tmpl/htmlparser', [
   'UI/_builder/Tmpl/html/Parser',
   'UI/_builder/Tmpl/utils/ErrorHandler',
   'UI/_builder/Tmpl/core/Tags',
   'Core/htmlparser2',
   'UI/_builder/Tmpl/handlers/third-party/dom',
   'UI/_builder/Tmpl/checkDomHandler'
], function(
   Parser,
   ErrorHandler,
   Tags,
   HtmlParser2,
   DomHandler,
   CheckDomHandler
) {
   'use strict';

   /**
    * @author Крылов М.А.
    *
    * Модуль для поддержания совместимости между html-парсерами.
    *
    * В случае критических ошибок откат к предыдущему поведению
    * осуществляется с помощью флага USE_NEW_HTML_PARSER.
    *
    * TODO: Удалить в 20.6100 после тестирования.
    */

   var USE_NEW_HTML_PARSER = true;

   var errorHandler = new ErrorHandler.default();

   function defaultHandler(error) {
      if (error) {
         errorHandler.error(
            error.message,
            {
               fileName: this.fileName
            }
         );
      }
   }

   function preprocess(text) {
      return text
         .replace(/>[\s]*[\n\r][\s]*/ig, '>')
         .replace(/[\s]*[\n\r][\s]*</ig, '<')
         .replace(/[\n\r]</ig, '<')
         .replace(/>[\n\r]/ig, '>');
   }

   function oldParse(html, handler, isCheckTmpl, fileName) {
      var tmpl = preprocess(html);
      if (isCheckTmpl) {
         var checkParser = new HtmlParser2(new CheckDomHandler(function(error) {
            if (error) {
               error.message = 'fileName: ' + fileName + ',\n' + error.message;
               throw error;
            }
         }), {
            xmlMode: true,
            recognizeSelfClosing: true,
            failOnInnerCurlyBrace: true,
            generateTagErrors: true
         });
         checkParser.write(tmpl);
         checkParser.done();
      }
      var handlerOptions = {
         ignoreWhitespace: true
      };
      var parserOptions = {
         lowerCaseTags: false,
         lowerCaseAttributeNames: false,
         recognizeSelfClosing: true
      };
      var handler2 = new DomHandler(handler || defaultHandler, handlerOptions);
      var parser2 = new HtmlParser2(handler2, parserOptions);
      parser2.write(tmpl);
      parser2.done();
      return handler2.dom;
   }

   function newParse(tmpl, fileName, needPreprocess) {
      return Parser.parse(tmpl, fileName, {
         xml: true,
         allowComments: true,
         allowCDATA: true,
         compatibleTreeStructure: true,
         rudeWhiteSpaceCleaning: true,
         normalizeLineFeed: true,
         cleanWhiteSpaces: true,
         needPreprocess: needPreprocess,
         tagDescriptor: Tags.default,
         errorHandler: new ErrorHandler.default()
      });
   }

   return function parse(tmpl, handler, isCheckTmpl, fileName, needPreprocess) {
      if (USE_NEW_HTML_PARSER) {
         return newParse(tmpl, fileName, needPreprocess);
      }
      return oldParse(tmpl, handler, isCheckTmpl, fileName);
   };
});
