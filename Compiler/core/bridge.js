define('Compiler/core/bridge', [
   'Core/Deferred',
   'Compiler/core/_deprecated/traverse',
   'Compiler/core/Traverse',
   'Compiler/expressions/Parser',
   'Compiler/utils/ErrorHandler',
   'Compiler/core/PatchVisitor',
   'Compiler/core/Scope',
   'Compiler/i18n/Translator',
   'Compiler/expressions/DirtyCheckingPatch',
   'Compiler/utils/Helpers',
   'Compiler/core/Annotate',
   'Compiler/core/Internal'
], function(
   Deferred,
   traversing,
   TraverseLib,
   ParserLib,
   ErrorHandlerLib,
   PatchVisitorLib,
   ScopeLib,
   Translator,
   dirtyCheckingPatch,
   Helpers,
   Annotate,
   Internal
) {
   'use strict';

   /**
    * @deprecated
    * @description Модуль предназначен для соединения старой и новой логик разбора и аннотации деревьев.
    * @author Крылов М.А.
    */

   /**
    * Флаг - использовать traverse посетителей.
    */
   var USE_TRAVERSE_VISITOR = true;

   /**
    * Флаг - использовать annotate посетителей.
    */
   var USE_ANNOTATION_VISITOR = true;

   /**
    * Флаг - генерировать rk-функции
    * @todo https://online.sbis.ru/opendoc.html?guid=ea8a25dd-5a2f-4330-8d6f-599c8c5878dd
    * @type {boolean}
    */
   var USE_GENERATE_CODE_FOR_TRANSLATIONS = false;

   /**
    * Old annotation method.
    * @deprecated
    */
   function annotateOld(traversed, options, traverseOptions, deferred) {
      PatchVisitorLib.default(traversed, traverseOptions.scope);
      traversed.__newVersion = true;
      var foundVars = [];
      var foundChildren = [];
      for (var index = 0; index < traversed.length; index++) {
         try {
            foundVars = foundVars.concat(dirtyCheckingPatch.gatherReactive(traversed[index]));
            foundChildren = foundChildren.concat(traversed[index].childrenStorage || []);
         } catch (error) {
            deferred.errback(new Error(
               'При выполнении аннотирования AST-дерева шаблона "' + options.fileName + '" возникла ошибка: ' + error.message
            ));
            return;
         }
      }

      // формируем набор реактивных свойств, "служебные" свойства игнорируем
      traversed.reactiveProps = Helpers.uniq(foundVars).filter(function(item) {
         return item !== '...' && item !== '_options' && item !== '_container' && item !== '_children' && item !== 'rk';
      });

      traversed.childrenStorage = foundChildren;

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
    * New annotation method.
    */
   function annotateWithVisitors(traversed, options, traverseOptions, deferred) {
      if (Internal.canUseNewInternalMechanism()) {
         Internal.process(traversed, traverseOptions.scope);
      } else {
         Annotate.default(traversed, traverseOptions.scope);
      }

      PatchVisitorLib.default(traversed, traverseOptions.scope);

      // FIXME: DEVELOP: REMOVE
      traversed.reactiveProps.sort();

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
   function traverseWithVisitors(htmlTree, options) {
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
         )
      };
      var traverseOptions = {
         fileName: options.fileName,
         scope: scope,
         translateText: true
      };
      var traversed = TraverseLib.default(htmlTree, traverseConfig, traverseOptions);
      var hasFailures = errorHandler.hasFailures();
      var lastMessage = errorHandler.popLastErrorMessage();
      errorHandler.flush();
      if (hasFailures) {
         deferred.errback(new Error(lastMessage));
         return deferred;
      }
      scope.requestDependencies().addCallbacks(function() {
         if (USE_ANNOTATION_VISITOR) {
            return annotateWithVisitors(traversed, options, traverseOptions, deferred);
         }
         return annotateOld(traversed, options, traverseOptions, deferred);
      }, function(error) {
         deferred.errback(error);
      });
      return deferred;
   }

   /**
    * Traverse tree.
    */
   function traverse(htmlTree, resolver, options) {
      if (USE_TRAVERSE_VISITOR) {
         return traverseWithVisitors(htmlTree, options);
      }
      return traversing.traverse(htmlTree, resolver, options);
   }

   /**
    * Check if using code generation visitor is allowed.
    */
   function canUseCodegenVisitors() {
      return USE_TRAVERSE_VISITOR && USE_ANNOTATION_VISITOR;
   }

   return {
      traverse: traverse,
      canUseCodegenVisitors: canUseCodegenVisitors
   };
});