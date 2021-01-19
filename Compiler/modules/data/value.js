define('Compiler/modules/data/value', function() {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   return function stringTag(injected, types, scopeData, propertyName) {
      if (injected.children) {
         var children = injected.children;
         for (var i = 0; i < children.length; i++) {
            if (children[i].type === 'text') {
               return this._processData(
                  children[i].data,
                  scopeData, {
                     isControl: injected.isControl,
                     rootConfig: injected.rootConfig,
                     propertyName: propertyName
                  }
               );
            }
         }
      }
      return undefined;
   };
});
