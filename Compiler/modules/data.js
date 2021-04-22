define('Compiler/modules/data', [
   'Compiler/modules/data/string',
   'Compiler/modules/data/array',
   'Compiler/modules/data/object',
   'Compiler/modules/data/number',
   'Compiler/modules/data/boolean',
   'Compiler/modules/data/function',
   'Compiler/modules/data/value'
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
