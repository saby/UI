define('UI/_builder/Tmpl/core/bridge', [
   'UI/_builder/Tmpl/core/_deprecated/traverse',
   'UI/_builder/Tmpl/core/Traverse',
   'UI/_builder/Tmpl/core/_deprecated/postTraverse',
   'UI/_builder/Tmpl/expressions/_private/Parser',
   'UI/_builder/Tmpl/utils/ErrorHandler',
   'UI/_builder/Tmpl/core/PatchVisitor',
   'Core/Deferred',
   'UI/_builder/Tmpl/core/Scope'
], function(traversing, TraverseLib, postTraverse, ParserLib, ErrorHandlerLib, PatchVisitorLib, Deferred, ScopeLib) {
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
         scope: new ScopeLib.default()
      };
      var traversed = TraverseLib.default(htmlTree, traverseConfig, traverseOptions);
      PatchVisitorLib.default(traversed);
      postTraverse.call({
         createResultDictionary: options.createResultDictionary,
         words: options.words,
         fileName: options.fileName
      }, deferred, traversed);
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
