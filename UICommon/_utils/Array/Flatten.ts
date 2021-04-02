/// <amd-module name="UICommon/_utils/Array/Flatten" />
/**
 * @author Мальцев А.А.
 */
/**
 * Модуль, в котором описана функция <b>flatten(arr)</b>.
 *
 * "Выравнивает" вложенные массивы (любого уровня вложенности), склеивая в одноуровневый массив.
 *
 * @param {Array} arr
 * @returns {Array}
 * @example
 * <pre>
 * flatten([1, [2], [3, [[4]]]]) => [1, 2, 3, 4]
 * </pre>
 */
export default function flatten<T>(arr: T[], skipundefined?: boolean): T[] {
   let result = [];
   const ln = arr.length;
   for (let i = 0; i !== ln; i++) {
      if (Array.isArray(arr[i])) {
         result = result.concat(flatten<any>(arr[i] as any, skipundefined) as any);
      } else {
         if (skipundefined && arr[i] === undefined) {
            continue;
         }
         result.push(arr[i]);
      }
   }
   return result;
};
