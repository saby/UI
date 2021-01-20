define('UI/_builder/Tmpl/modules/data/string', function() {
   'use strict';

   /**
    * @author Крылов М.А.
    */

   return function stringTag(injected, types, scopeData, propertyName) {
      var string = '';
      if (injected.children) {
         var children = injected.children;
         for (var i = 0; i < children.length; i++) {
            if (children[i].type === 'text') {
               string += this._processData(
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
      return string;
   };
});
