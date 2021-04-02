/// <amd-module name="UICore/_utils/Object/IsPlainObject" />

/**
 *
 * Модуль, в котором описана функция <b>isPlainObject(obj)</b>, которая проверяет, что переданный объект является простым (экземпляром Object, который не является наследником Object).
 *
 * Такая проверка бывает нужна для аргументов, представляющих собой хеш с ключами и значениями, для того, чтобы отличать их от объектов Date, jquery, или экземпляров классов.
 *
 * <h2>Возвращает</h2>
 * Функция возвращает true, когда объект является простым.
 *
 * <h2>Пример использования</h2>
 *
 * <pre>
 *    require(['UICommon/Utils'], function(Utils) {
 *       var isPlainObject = Utils.ObjectUtils.isPlainObject;
 *
 *       // true
 *       console.log(isPlainObject({}));
 *
 *       // false
 *       console.log(isPlainObject(new Date()));
 *    });
 * </pre>
 *
 * @class UICore/_utils/Object/IsPlainObject
 * @public
 * @author Мальцев А.А.
 */
var objTag = '[object Object]';

export default function isPlainObject(obj) {
   //@ts-ignore
   if (Object.getPrototypeOf.simulated && typeof jQuery !== 'undefined') {
      // Используем $.isPlainObject - так как он нормально работает в IE8.
      //@ts-ignore
      return jQuery.isPlainObject(obj);
   } else {
      return !!(obj && Object.prototype.toString.call(obj) === objTag && Object.getPrototypeOf(obj) === Object.prototype);
   }
}