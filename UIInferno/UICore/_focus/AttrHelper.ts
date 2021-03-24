/// <amd-module name="UICore/_focus/AttrHelper" />
/* tslint:disable */

/**
 * @author Кондаков Р.Н.
 */

export function isAttr(string) {
   return string.startsWith('attr:');
}

export function checkAttr(attrs) {
   for (const key in attrs) {
      if (isAttr(key)) {
         return true;
      }
   }
   return false;
}
