define('View/Builder/Tmpl/modules/data', [
   'View/Builder/Tmpl/modules/data/string',
   'View/Builder/Tmpl/modules/data/array',
   'View/Builder/Tmpl/modules/data/object',
   'View/Builder/Tmpl/modules/data/number',
   'View/Builder/Tmpl/modules/data/boolean',
   'View/Builder/Tmpl/modules/data/function',
   'View/Builder/Tmpl/modules/data/value'
], function injectedDataForceLoader(str, arr, obj, num, bool, func, value) {
   'use strict';

   /**
    * Типы данных для внедрения в тэгах компонента или partial
    *
    * @author Крылов М.А.
    */

   return function injectedDataForce(data, scopeData, restricted) {
      var types = {
         String: str,
         Array: arr,
         Object: obj,
         Number: num,
         Boolean: bool,
         Function: func,
         Value: value
      };
      return types.Object.call(this, data, types, scopeData, undefined, restricted, true);
   };
});
