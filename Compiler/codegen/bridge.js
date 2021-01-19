define('Compiler/codegen/bridge', [
   'Compiler/core/bridge',
   'Compiler/core/function'
], function(
   coreBridge,
   processingToFunction
) {
   'use strict';

   /**
    * @description Модуль предназначен для соединения старой и новой логик генерации кода шаблона.
    * @author Крылов М.А.
    * @file Compiler/codegen/bridge.js
    */

   /**
    * Флаг включения посетителей генерации кода.
    */
   var CODEGEN_VISITORS = false;

   /**
    * Флаг - использовать посетителей генерации кода.
    */
   var USE_CODEGEN_VISITORS = CODEGEN_VISITORS && coreBridge.canUseCodegenVisitors();

   /**
    * Инициализировать окружение для wml.
    * @param templateNames {string[]} Коллекция имен inline-шаблонов.
    */
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

   /**
    * Инициализировать окружение для tmpl.
    * @param templateNames {string[]} Коллекция имен inline-шаблонов.
    */
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

   /**
    * Очистить окружение
    */
   function cleanWorkspace() {
      processingToFunction.functionNames = null;
      processingToFunction.includedFunctions = null;
      processingToFunction.privateFn = null;
      processingToFunction.includedFn = null;
   }

   /**
    * Выполнить генерацию шаблона.
    * @param ast AST-дерево
    * @param data Данные
    * @param handlers Обработчики
    * @param attributes Атрибуты
    * @param internal Коллекция internal-выражений
    * @returns {*} Возвращает шаблонную функцию.
    */
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
