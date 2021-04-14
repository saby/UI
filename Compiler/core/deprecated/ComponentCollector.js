define('Compiler/core/deprecated/ComponentCollector', [
   'Compiler/modules/utils/tag',
   'Compiler/modules/utils/common',
   'Compiler/expressions/Statement',
   'Compiler/modules/data/utils/dataTypesCreator'
], function(
   tagUtils,
   utils,
   processStatement,
   DTC
) {
   'use strict';

   /**
    * @deprecated
    * @description Модуль предназначен для сбора зависимостей шаблона путем обхода дерева.
    * @author Крылов М.А.
    */

   /**
    * Create template dependency.
    * @param template {*} Template node.
    * @returns {string|undefined|*}
    */
   function createTemplate(template) {
      // FIXME: разбор-сборка по плагинам require.

      var optionalTemplate = template.split('optional!')[1];
      if (optionalTemplate) {
         return 'optional!' + optionalTemplate;
      }

      var jsTemplate = template.split('js!')[1];
      if (jsTemplate) {
         return 'js!' + jsTemplate;
      }

      var htmlTemplate = template.split('html!')[1];
      if (htmlTemplate) {
         return 'html!' + htmlTemplate;
      }

      var tmplTemplate = template.split('tmpl!')[1];
      if (tmplTemplate) {
         return 'tmpl!' + tmplTemplate;
      }

      var wmlTemplate = template.split('wml!')[1];
      if (wmlTemplate) {
         return 'wml!' + wmlTemplate;
      }

      var slashedTemplate = template.split('/')[1];
      if (slashedTemplate) {
         return template;
      }
      return undefined;
   }

   /**
    * Check component.
    * @param name {*} Component name.
    * @param types {*} Special types.
    * @param entity {*} Component node.
    */
   function checkIfComponent(name, types, entity) {
      var wsComponent = tagUtils.checkForControl(name, true, false, true);
      if (wsComponent) {
         return wsComponent;
      }
      if (name === 'ws:partial' && entity.attribs && processStatement.isStaticString(entity.attribs.template)) {
         return createTemplate(entity.attribs.template);
      }
      return undefined;
   }

   /**
    * Get component dependencies.
    * @param cArray {*} Dependencies collection.
    * @param ast {*} Ast array.
    */
   function getComponentsRec(cArray, ast) {
      var componentName;
      for (var i = 0; i < ast.length; i++) {
         componentName = checkIfComponent(ast[i].name, DTC.injectedDataTypes, ast[i]);
         if (componentName) {
            if (utils.isLibraryModuleString(componentName)) {
               // this is a library module, we should add the whole library to the dependencies
               componentName = utils.splitModule(componentName).library;
            }
            if (cArray.indexOf(componentName) === -1) {
               cArray.push(componentName);
            }
         }
         if (ast[i].children && ast[i].children.length > 0) {
            getComponentsRec(cArray, ast[i].children);
         }
      }
   }

   /**
    * Get component dependencies.
    * @param ast {*} Ast array.
    * @returns {[]} Component dependencies.
    */
   function getComponents(ast) {
      var cArray = [];
      getComponentsRec(cArray, ast);
      return cArray;
   }

   /**
    * Get component dependencies with 'UI/Executor'.
    * @param ast {*} Ast array.
    * @param error {*} Error instance.
    * @returns {[]} Component dependencies.
    */
   function getDependencies(ast, error) {
      if (!error) {
         return [
            'UI/Executor'
         ].concat(getComponents(ast));
      }
      return undefined;
   }

   return {
      getComponents: getComponents,
      getDependencies: getDependencies
   };
});
