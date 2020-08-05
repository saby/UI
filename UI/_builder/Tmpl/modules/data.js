define('UI/_builder/Tmpl/modules/data', [
   'UI/_builder/Tmpl/modules/data/string',
   'UI/_builder/Tmpl/modules/data/array',
   'UI/_builder/Tmpl/modules/data/object',
   'UI/_builder/Tmpl/modules/data/number',
   'UI/_builder/Tmpl/modules/data/boolean',
   'UI/_builder/Tmpl/modules/data/function',
   'UI/_builder/Tmpl/modules/data/value'
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
