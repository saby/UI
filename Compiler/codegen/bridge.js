define('Compiler/codegen/bridge', [
   'Compiler/codegen/function'
], function(
   processingToFunction
) {
   'use strict';

   /**
    * @description Модуль предназначен для соединения старой и новой логик генерации кода шаблона.
    * @author Крылов М.А.
    */

   var USE_GENERATE_CODE_FOR_TRANSLATIONS = false;

   /**
    * Инициализировать окружение для wml.
    * @param templateNames {string[]} Коллекция имен inline-шаблонов.
    */
   function initWorkspaceWML(templateNames) {
      processingToFunction.functionNames = { };
      if (Array.isArray(templateNames)) {
         for (var index = 0; index < templateNames.length; ++index) {
            var name = templateNames[index];
            processingToFunction.functionNames[name] = 1;
         }
      }
      processingToFunction.privateFn = [];
      processingToFunction.includedFn = { };
      processingToFunction.includedFunctions = { };
      processingToFunction.internalFunctions = [];
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
            processingToFunction.functionNames[name] = 1;
         }
      }
      processingToFunction.includedFunctions = { };
      processingToFunction.privateFn = null;
      processingToFunction.includedFn = null;
      processingToFunction.internalFunctions = null;
   }

   /**
    * Очистить окружение
    */
   function cleanWorkspace() {
      processingToFunction.functionNames = null;
      processingToFunction.includedFunctions = null;
      processingToFunction.privateFn = null;
      processingToFunction.includedFn = null;
      processingToFunction.internalFunctions = null;
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
      if (typeof handlers.generateTranslations === 'undefined') {
         handlers.generateTranslations = (
             handlers.generateCodeForTranslations && USE_GENERATE_CODE_FOR_TRANSLATIONS
             || !USE_GENERATE_CODE_FOR_TRANSLATIONS
         ) && ast.hasTranslations;
      }
      return processingToFunction.getFunction(ast, data, handlers, attributes, internal);
   }

   function getFunctionWithUnit(unit, options) {
      // TODO: Новая функция генерации кода по юниту. Перейти везде на эту функцию.
      //   Убрать перенос опций на массив.
      unit.tree.childrenStorage = unit.childrenStorage;
      unit.tree.reactiveProps = unit.reactiveProps;
      unit.tree.templateNames = unit.templateNames;
      unit.tree.container = unit.container;
      unit.tree.hasTranslations = unit.hasTranslations;
      unit.tree.__newVersion = unit.__newVersion;
      return processingToFunction.getFunction(unit.tree, null, options, null, null);
   }

   return {
      initWorkspaceWML: initWorkspaceWML,
      initWorkspaceTMPL: initWorkspaceTMPL,
      cleanWorkspace: cleanWorkspace,
      getFunction: getFunction,
      getFunctionWithUnit: getFunctionWithUnit
   };
});
