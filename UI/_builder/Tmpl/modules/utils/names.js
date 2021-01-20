define('UI/_builder/Tmpl/modules/utils/names', [
   'UI/_builder/Tmpl/modules/utils/common'
], function(common) {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   function isTemplateString(str) {
      return /(optional!|^)tmpl!/.test(str) ||
         /(optional!|^)html!/.test(str) ||
         /(optional!|^)wml!/.test(str);
   }

   function isControlString(str) {
      return /(optional!|^)js!/.test(str);
   }

   function isOptionalString(str) {
      return str.indexOf('optional!') === 0;
   }

   /**
    * Для поиска резолвера имен в конфине, если он есть.
    * @param name
    * @param resolvers
    * @returns {*}
    */
   function hasResolver(name, resolvers) {
      for (var resolver in resolvers) {
         if (resolvers.hasOwnProperty(resolver)) {
            return name.indexOf(resolver) === 0
               ? resolver
               : undefined;
         }
      }
      return undefined;
   }

   function isStringModules(str, config) {
      return isOptionalString(str) ||
         isTemplateString(str) ||
         isControlString(str) ||
         common.isSlashedControl(str) ||
         hasResolver(str, config && config.resolvers);
   }

   /**
    * Для использования найденного резолвера имен для partial
    * @param name
    * @param resolvers
    * @returns {*}
    */
   function findResolverInConfig(name, resolvers) {
      var resolverName = hasResolver(name, resolvers);
      if (resolverName) {
         return resolvers[resolverName];
      }
      return undefined;
   }

   return {
      isStringModules: isStringModules,
      isTemplateString: isTemplateString,
      isControlString: isControlString,
      isOptionalString: isOptionalString,
      findResolverInConfig: findResolverInConfig,
      isSlashedControl: common.isSlashedControl
   };
});
