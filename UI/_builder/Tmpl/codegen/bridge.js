define('UI/_builder/Tmpl/codegen/bridge', [
   'UI/_builder/Tmpl/core/bridge',
   'UI/_builder/Tmpl/function'
], function(
   coreBridge,
   processingToFunction
) {
   'use strict';

   var CODEGEN_VISITORS = false;
   var USE_CODEGEN_VISITORS = CODEGEN_VISITORS && coreBridge.canUseCodegenVisitors();

   function initWorkspaceWML() {
      processingToFunction.functionNames = { };
      processingToFunction.privateFn = [];
      processingToFunction.includedFn = { };
      processingToFunction.includedFunctions = { };
   }

   function initWorkspaceTMPL() {
      // FIXME: do not check template function name (diff stage)
      processingToFunction.functionNames = null;
      processingToFunction.includedFunctions = { };
      processingToFunction.privateFn = null;
      processingToFunction.includedFn = null;
   }

   function cleanWorkspace() {
      processingToFunction.functionNames = null;
      processingToFunction.includedFunctions = null;
      processingToFunction.privateFn = null;
      processingToFunction.includedFn = null;
   }

   function getFunctionWithVisitors() {
      throw new Error('Not implemented yet');
   }

   function getFunction(ast, data, handlers, attributes, internal) {
      if (USE_CODEGEN_VISITORS) {
         return getFunctionWithVisitors();
      }
      return processingToFunction.getFunction(ast, data, handlers, attributes, internal);
   }

   return {
      initWorkspaceWML: initWorkspaceWML,
      initWorkspaceTMPL: initWorkspaceTMPL,
      cleanWorkspace: cleanWorkspace,
      getFunction: getFunction
   };
});
