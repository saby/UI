define('UI/_builder/Tmpl/core/bridge', [
   'UI/_builder/Tmpl/core/_deprecated/traverse',
   'UI/_builder/Tmpl/core/Traverse',
   'UI/_builder/Tmpl/expressions/_private/Parser',
   'UI/_builder/Tmpl/utils/ErrorHandler',
   'UI/_builder/Tmpl/core/PatchVisitor',
   'Core/Deferred',
   'UI/_builder/Tmpl/core/Scope',
   'UI/_builder/Tmpl/i18n/Translator',
   'UI/_builder/Tmpl/expressions/_private/DirtyCheckingPatch',
   'UI/Utils'
], function(
   traversing,
   TraverseLib,
   ParserLib,
   ErrorHandlerLib,
   PatchVisitorLib,
   Deferred,
   ScopeLib,
   Translator,
   dirtyCheckingPatch,
   Utils
) {
   'use strict';
   var USE_VISITOR = false;

   var uniqueArray = Utils.ArrayUtils.uniq;

   function traverseWithVisitors(htmlTree, options) {
      var deferred = new Deferred();
      var scope = new ScopeLib.default(!options.fromBuilderTmpl);
      var errorHandler = new ErrorHandlerLib.default();
      var traverseConfig = {
         expressionParser: new ParserLib.Parser(),
         hierarchicalKeys: true,
         errorHandler: errorHandler,
         allowComments: false,
         textTranslator: Translator.createTextTranslator(options.componentsProperties || { })
      };
      var traverseOptions = {
         fileName: options.fileName,
         scope: scope,
         translateText: true
      };
      var traversed = TraverseLib.default(htmlTree, traverseConfig, traverseOptions);
      PatchVisitorLib.default(traversed, traverseOptions.scope);
      if (errorHandler.hasErrors() || errorHandler.hasCriticalErrors()) {
         deferred.errback(
            new Error(
               'При обработке файла "' + options.fileName + '" возникли ошибки. Смотри логи'
            )
         );
         return deferred;
      }
      scope.requestDependencies().then(function() {
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
         traversed.reactiveProps = uniqueArray(foundVars).filter(function(item) {
            return item !== '...' && item !== '_options' && item !== '_container' && item !== '_children';
         });

         traversed.childrenStorage = foundChildren;

         // в случае сбора словаря локализуемых слов отдаем объект
         // { astResult - ast-дерево, words - словарь локализуемых слов }
         if (options.createResultDictionary) {
            deferred.callback({
               astResult: traversed,
               words: scope.getTranslationKeys()
            });
            return;
         }
         deferred.callback(traversed);
      });
      return deferred;
   }

   function traverse(htmlTree, resolver, options) {
      if (USE_VISITOR) {
         return traverseWithVisitors(htmlTree, options);
      }
      return traversing.traverse(htmlTree, resolver, options);
   }

   return {
      traverse: traverse
   };
});
