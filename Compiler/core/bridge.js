define('Compiler/core/bridge', [
   'Core/Deferred',
   'Compiler/core/Traverse',
   'Compiler/expressions/Parser',
   'Compiler/utils/ErrorHandler',
   'Compiler/core/PatchVisitor',
   'Compiler/core/Scope',
   'Compiler/i18n/Translator',
   'Compiler/core/Annotate'
], function(
   Deferred,
   TraverseLib,
   ParserLib,
   ErrorHandlerLib,
   PatchVisitorLib,
   ScopeLib,
   Translator,
   Annotate
) {
   'use strict';

   /**
    * @deprecated
    * @description Модуль предназначен для соединения старой и новой логик разбора и аннотации деревьев.
    * @author Крылов М.А.
    */

   /**
    * Флаг - генерировать rk-функции
    * @todo https://online.sbis.ru/opendoc.html?guid=ea8a25dd-5a2f-4330-8d6f-599c8c5878dd
    * @type {boolean}
    */
   var USE_GENERATE_CODE_FOR_TRANSLATIONS = false;

   /**
    * New annotation method.
    */
   function annotateWithVisitors(traversed, options, traverseOptions, deferred) {
      Annotate.process(traversed, traverseOptions.scope);
      PatchVisitorLib.default(traversed, traverseOptions.scope);

      // в случае сбора словаря локализуемых слов отдаем объект
      // { astResult - ast-дерево, words - словарь локализуемых слов }
      if (options.createResultDictionary) {
         deferred.callback({
            astResult: traversed,
            words: traverseOptions.scope.getTranslationKeys()
         });
         return;
      }
      deferred.callback(traversed);
   }

   /**
    * New traverse method.
    */
   function traverse(htmlTree, options) {
      var deferred = new Deferred();
      var scope = new ScopeLib.default(!options.fromBuilderTmpl);
      var errorHandler = ErrorHandlerLib.createErrorHandler(!options.fromBuilderTmpl);
      var traverseConfig = {
         expressionParser: new ParserLib.Parser(),
         hierarchicalKeys: true,
         errorHandler: errorHandler,
         allowComments: false,
         textTranslator: Translator.createTextTranslator(options.componentsProperties || { }),
         generateTranslations: (
            (USE_GENERATE_CODE_FOR_TRANSLATIONS && !!options.generateCodeForTranslations) ||
            !USE_GENERATE_CODE_FOR_TRANSLATIONS
         ),
         hasExternalInlineTemplates: options.hasExternalInlineTemplates
      };
      var traverseOptions = {
         fileName: options.fileName,
         scope: scope,
         translateText: true
      };
      var traversed = TraverseLib.default(htmlTree, traverseConfig, traverseOptions);
      var hasFailures = errorHandler.hasFailures();
      var lastMessage = hasFailures ? errorHandler.popLastErrorMessage() : undefined;
      errorHandler.flush();
      if (hasFailures) {
         deferred.errback(new Error(lastMessage));
         return deferred;
      }
      scope.requestDependencies().addCallbacks(function() {
         return annotateWithVisitors(traversed, options, traverseOptions, deferred);
      }, function(error) {
         deferred.errback(error);
      });
      return deferred;
   }

   function traverseSync(htmlTree, options) {
      var scope = new ScopeLib.default(!options.fromBuilderTmpl);
      var errorHandler = ErrorHandlerLib.createErrorHandler(!options.fromBuilderTmpl);
      var traverseConfig = {
         expressionParser: new ParserLib.Parser(),
         hierarchicalKeys: true,
         errorHandler: errorHandler,
         allowComments: false,
         textTranslator: Translator.createTextTranslator(options.componentsProperties || { }),
         generateTranslations: (
             (USE_GENERATE_CODE_FOR_TRANSLATIONS && !!options.generateCodeForTranslations) ||
             !USE_GENERATE_CODE_FOR_TRANSLATIONS
         ),
         hasExternalInlineTemplates: options.hasExternalInlineTemplates
      };
      var traverseOptions = {
         fileName: options.fileName,
         scope: scope,
         translateText: true
      };
      var traversed = TraverseLib.default(htmlTree, traverseConfig, traverseOptions);
      var hasFailures = errorHandler.hasFailures();
      var lastMessage = hasFailures ? errorHandler.popLastErrorMessage() : undefined;
      errorHandler.flush();
      if (hasFailures) {
         throw new Error(lastMessage);
      }

      // annotation
      Annotate.process(traversed, traverseOptions.scope);
      PatchVisitorLib.default(traversed, traverseOptions.scope);

      return {
         astResult: traversed,
         words: traverseOptions.scope.getTranslationKeys()
      };
   }

   return {
      traverseSync: traverseSync,
      traverse: traverse
   };
});
