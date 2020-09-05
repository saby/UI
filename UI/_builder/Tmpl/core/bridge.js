define('UI/_builder/Tmpl/core/bridge', [
   'UI/_builder/Tmpl/core/_deprecated/traverse',
   'UI/_builder/Tmpl/core/Traverse',
   'UI/_builder/Tmpl/core/_deprecated/postTraverse',
   'UI/_builder/Tmpl/expressions/_private/Parser',
   'UI/_builder/Tmpl/utils/ErrorHandler',
   'UI/_builder/Tmpl/core/PatchVisitor',
   'Core/Deferred',
   'UI/_builder/Tmpl/core/Scope',
   'UI/_builder/Tmpl/core/i18n'
], function(
   traversing,
   TraverseLib,
   postTraverse,
   ParserLib,
   ErrorHandlerLib,
   PatchVisitorLib,
   Deferred,
   ScopeLib,
   i18n
) {
   'use strict';
   var USE_VISITOR = false;

   function traverseWithVisitors(htmlTree, options) {
      var deferred = new Deferred();
      var scope = new ScopeLib.default(!options.fromBuilderTmpl);
      var traverseConfig = {
         expressionParser: new ParserLib.Parser(),
         hierarchicalKeys: true,
         errorHandler: new ErrorHandlerLib.default(),
         allowComments: false,
         textTranslator: i18n.createTextTranslator()
      };
      var traverseOptions = {
         fileName: options.fileName,
         scope: scope,
         translateText: true
      };
      var traversed = TraverseLib.default(htmlTree, traverseConfig, traverseOptions);
      PatchVisitorLib.default(traversed, traverseOptions.scope);
      scope.requestDependencies().then(function() {
         // post traverse
         postTraverse.call({
            createResultDictionary: options.createResultDictionary,
            words: scope.getTranslationKeys(),
            fileName: options.fileName
         }, deferred, traversed);
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
