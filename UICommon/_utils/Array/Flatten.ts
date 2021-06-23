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
 * @param {Boolean} skipUndefined
 * @param {Boolean} skipEmptyString
 * @returns {Array}
 * @example
 * <pre>
 * flatten([1, [2], [3, [[4]]]]) => [1, 2, 3, 4]
 * </pre>
 */
export default function flatten<T>(arr: T[], skipUndefined?: boolean, skipEmptyString?: boolean): T[] {
   let result = [];
   const ln = arr.length;
   for (let i = 0; i !== ln; i++) {
      if (Array.isArray(arr[i])) {
         result = result.concat(flatten<any>(arr[i] as any, skipUndefined, skipEmptyString) as any);
         if (arr[i].for) {
            Object.defineProperty(result, 'for', {value: true, enumerable: false});
         }
      } else {
         if (skipUndefined && arr[i] === undefined) {
            continue;
         }

         // Убираем пустые строки, чтобы не трогать кодогенерацию одинаковую для React и Inferno
         // Inferno отрисовывает пустые строки, а для React это не валидная нода
         if (skipEmptyString && arr[i] as unknown === '') {
            continue;
         }
         result.push(arr[i]);
      }
   }
   return result;
};
