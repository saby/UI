/// <amd-module name="UICommon/_utils/Object/IsEmpty" />
/**
 * @author Мальцев А.А.
 */
const nativeStringifier = Object.prototype.toString;
const objectTag = '[object Object]';

export default function isEmpty(obj: any): boolean {
   if (obj === null || typeof obj !== 'object') {
      return false;
   }

   const tag = nativeStringifier.call(obj);
   if (tag === objectTag || obj instanceof Object) {
      // tslint:disable-next-line: forin
      for (const _key in obj) {
         return false;
      }
   }

   return true;
};
