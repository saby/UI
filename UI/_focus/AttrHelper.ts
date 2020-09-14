/// <amd-module name="UI/_focus/AttrHelper" />
/* tslint:disable */

/**
 * @author Тэн В.А.
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
