/// <amd-module name="UICommon/_utils/Array/FindIndex" />

/**
 * Модуль, в котором описана функция <b>findIndex(array, predicate, context)</b>.
 *
 * Производит поиск индекса элемента массива, удовлетворяющего заданному условию.
 * Вызывает predicate для каждого элемента, и возвращает индекс первого элемента, результат predicate для которого
 * положителен.
 * predicate вызывается с аргументами (value, index, array), где array - исходный массив.
 *
 * <h2>Параметры функции</h2>
 *
 * <ul>
 *     <li><b>array</b> {Array} - исходный массив.</li>
 *     <li><b>[predicate]</b> {Function} - Функция, вызываемая для каждого элемента. Должна возвращать true или
 *        эквивалентное ему значение, которое показывает, что поиск завершен. Может быть не указана, тогда вместо неё
 *        используется преобразование текущего элемента в Boolean.
 *     </li>
 *     <li><b>[context]</b> {Object} - Контекст, в котором будет выполняться predicate.</li>
 * </ul>
 *
 * <h2>Возвращает</h2>
 *
 * Индекс элемента, если он найден, или -1.
 *
 * <h2>Пример использования</h2>
 *
 * <pre>
 * require(['UICommon/Utils'], function(Utils) {
 *    var findIndex = Utils.ArrayUtils.findIndex;
 *
 *    //2
 *    console.log(findIndex([1, 2, 3, 4, 5], function(value) {
 *       return value % 3 === 0;
 *    }));
 * });
 * </pre>
 * @class UICommon/_utils/Array/findIndex
 * @public
 * @author Мальцев А.А.
 */
export default function findIndex<T>(array: T[], predicate?: Function, context?: object): number {
   let result = -1;

   if (!Array.isArray(array)) {
      return result;
   }

   if (!predicate) {
      predicate = (item) => !!item;
   }

   for (let i = 0, l = array.length; i < l; i++) {
      if (i in array) {
         if (predicate.call(context, array[i], i, array)) {
            result = i;
            break;
         }
      }
   }

   return result;
};
