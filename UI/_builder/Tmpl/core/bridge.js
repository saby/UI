define('UI/_builder/Tmpl/core/bridge', [
   'UI/_builder/Tmpl/core/_deprecated/traverse',
   'UI/_builder/Tmpl/core/Traverse',
   'UI/_builder/Tmpl/core/_deprecated/postTraverse',
   'UI/_builder/Tmpl/expressions/_private/Parser',
   'UI/_builder/Tmpl/utils/ErrorHandler',
   'UI/_builder/Tmpl/core/PatchVisitor',
   'Core/Deferred',
   'UI/_builder/Tmpl/core/Scope',
   'UI/_builder/Tmpl/expressions/_private/DirtyCheckingPatch',
   'Core/helpers/Array/uniq'
], function(
   traversing,
   TraverseLib,
   postTraverse,
   ParserLib,
   ErrorHandlerLib,
   PatchVisitorLib,
   Deferred,
   ScopeLib,
   dirtyCheckingPatch,
   uniqueArray
) {
   'use strict';
   var USE_VISITOR = false;

   function traverseWithVisitors(htmlTree, options) {
      var deferred = new Deferred();
      var traverseConfig = {
         expressionParser: new ParserLib.Parser(),
         hierarchicalKeys: true,
         errorHandler: new ErrorHandlerLib.default(),
         allowComments: false
      };
      var traverseOptions = {
         fileName: options.fileName,
         scope: new ScopeLib.default(),
         translateText: true
      };
      var traversed = TraverseLib.default(htmlTree, traverseConfig, traverseOptions);
      PatchVisitorLib.default(traversed, traverseOptions.scope);

      // post traverse

      traversed.__newVersion = true;
      var foundVars = [];
      var foundChildren = [];
      for (var travI = 0; travI < traversed.length; travI++) {
         try {
            foundVars = foundVars.concat(dirtyCheckingPatch.gatherReactive(traversed[travI]));
            foundChildren = foundChildren.concat(traversed[travI].childrenStorage || []);
         } catch (error) {
            deferred.errback(new Error(
               'Something wrong with ' + this.fileName + ' template. ' + error.message
            ));
            return undefined;
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
            words: [] // TODO: Release words collecting
         });
      } else {
         deferred.callback(traversed);
      }
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
