define('UI/_builder/Tmpl/codegen/bridge', [
   'UI/_builder/Tmpl/core/bridge',
   'UI/_builder/Tmpl/function'
], function(
   coreBridge,
   processingToFunction
) {
   'use strict';

   /**
    * Модуль предназначен для соединения старой и новой логик генерации кода шаблона.
    * @author Крылов М.А.
    */

   var CODEGEN_VISITORS = false;
   var USE_CODEGEN_VISITORS = CODEGEN_VISITORS && coreBridge.canUseCodegenVisitors();

   function initWorkspaceWML(templateNames) {
      processingToFunction.functionNames = { };
      if (Array.isArray(templateNames)) {
         for (var index = 0; index < templateNames.length; ++index) {
            var name = templateNames[index];
            processingToFunction.functionNames[name] = 2;
         }
      }
      processingToFunction.privateFn = [];
      processingToFunction.includedFn = { };
      processingToFunction.includedFunctions = { };
   }

   function initWorkspaceTMPL(templateNames) {
      processingToFunction.functionNames = { };
      if (Array.isArray(templateNames)) {
         for (var index = 0; index < templateNames.length; ++index) {
            var name = templateNames[index];
            processingToFunction.functionNames[name] = 2;
         }
      }
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

   function getFunction(ast, data, handlers, attributes, internal) {
      if (USE_CODEGEN_VISITORS) {
         // TODO: Release
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
