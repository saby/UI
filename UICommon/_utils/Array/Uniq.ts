/// <amd-module name="UICommon/_utils/Array/Uniq" />

/**
 * Модуль, в котором описана функция <b>uniq(array)</b>.
 *
 * Функция корректно работает только со значениями, не являющимися объектами. При сравнении значений используется
 * нестрогий алгоритм (==).
 * Возвращает уникальный массив.
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *   <li><b>array</b> {Array} - исходный массив.</li>
 * </ul>
 *
 * <h2>Возвращает</h2>
 * Возвращает массив, содержащий уникальные элементы из исходного массива. Порядок элементов при этом сохраняется.
 *
 * <h2>Пример использования</h2>
 * <pre>
 *    require(['UICommon/Utils'], function(Utils) {
 *       var uniqArray = Utils.ArrayUtils.uniq;
 *
 *       // [1, 2, 3, 4, 5]
 *       console.log(uniqArray([1, 2, 3, 4, 3, 2, 5, 1]));
 *    });
 * </pre>
 *
 * @class UICommon/_utils/Array/uniq
 * @public
 * @author Мальцев А.А.
 */
export default function uniq<T>(array: T[]): T[] {
   if (!Array.isArray(array)) {
      throw new TypeError('Invalid type of the first argument. Array expected.');
   }

   const cache: any = {};
   return array.reduce((prev, curr) => {
      if (!cache.hasOwnProperty(curr)) {
         cache[curr] = true;
         prev.push(curr);
      }
      return prev;
   }, []);
};
