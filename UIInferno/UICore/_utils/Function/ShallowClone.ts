/// <amd-module name="UICore/_utils/Function/ShallowClone" />
import merge from './Merge';
/**
 *
 * Модуль, в котором описана функция <b>shallowClone(hash)</b>.
 *
 * Функция, делающая поверхностное (без клонирования вложенных объектов и массивов) копирование объекта или массива.
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *     <li><b>hash</b> {Object|Array} - исходный объект или массив.</li>
 * </ul>
 *
 * <h2>Возвращает</h2>
 * Скопированный объект или массив.
 *
 * @class UICore/_utils/Function/ShallowClone
 * @public
 * @author Мальцев А.А.
 */

export default function shallowClone<T>(hash: T): T {
   let result;
   if (Array.isArray(hash)) {
      result = hash.slice(0);
   } else {
      result = merge({}, hash, { clone: false, rec: false });
   }
   return result;
};
