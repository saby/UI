/// <amd-module name="UICommon/_executor/_Utils/Class" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */
function removeDuplicates(array) {
   for (var i = 0; i < array.length; ++i) {
      for (var j = i + 1; j < array.length; ++j) {
         if (array[i] === array[j]) {
            array.splice(j--, 1);
         }
      }
   }
   return array;
}

export function removeClassDuplicates(classStr) {
   var classArray = classStr.split(/\s+/);
   classArray = classArray.filter(function (str) {
      return str != "";
   });
   classArray = removeDuplicates(classArray);
   classStr = classArray.join(' ');
   return classStr;
}