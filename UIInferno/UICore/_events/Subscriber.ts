/// <amd-module name="UI/_events/Subscriber" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

/**
 * Создание функции для привязки событий
 * @param func - function for launch
 * @param args - arguments for mix
 * @returns {Function}
 */
export function getBindFunc(func, args) {
   return function () {
      var argsForLaunch = [], i;
      for (i = 0; i < arguments.length; i++) {
         argsForLaunch.push(arguments[i]);
      }
      for (i = 0; i < args.length; i++) {
         argsForLaunch.push(args[i]);
      }
      func.apply(undefined, argsForLaunch);
   };
}

/**
 * Извлекает события из опции объекта
 * @param _options
 * @returns {{}}
 */
export function getEventsListFromOptions(_options) {
   var eventsList = {};
   for (var key in _options) {
      if (_options.hasOwnProperty(key)) {
         if (key.indexOf('event:') === 0) {
            eventsList[key] = _options[key];
         }
      }
   }
   return eventsList;
}

/**
 * Перебирает события в списке событий
 * @param eventsList
 * @param func
 *    - executes for each (key, object) pair
 * @returns {void}
 */
export function forEventObjects(eventsList, func) {
   for (var key in eventsList) {
      if (eventsList.hasOwnProperty(key)) {
         var value = eventsList[key];
         for (var i = 0; i < value.length; i++) {
            func(key, value[i]);
         }
      }
   }
}

/**
 * Подписка инстанаса на все события в списке
 * @param inst
 * @param parent
 * @param eventsList
 * @returns {void}
 */
export function subscribeEvents(inst, parent, eventsList) {
   forEventObjects(eventsList, function (key, eventObject) {
      if (eventObject.fn) {
         eventObject.bindedFunc = getBindFunc(eventObject.fn, eventObject.args || []);
         inst.subscribe(key.split(':')[1], eventObject.bindedFunc);
      }
   });
}

/**
 * Отписка инстанаса на все события в списке
 *
 * @param inst
 * @param parent
 * @param eventsList
 * @returns {void}
 */
export function unsubscribeEvents(inst, parent, eventsList) {
   forEventObjects(eventsList, function (key, eventObject) {
      if (eventObject.bindedFunc) {
         inst.unsubscribe(key.split(':')[1], eventObject.bindedFunc);
      }
   });
}

/**
 * Применяет события к инстансу:
 *    1. Подписка событий на инстансе
 *    2. Отписка от событий при разрушении инстанса
 *
 * @param inst
 * @param parent
 * @param eventsList
 * @returns {void}
 */
export function applyEvents(inst, parent, eventsList) {
   subscribeEvents(inst, parent, eventsList);
   inst.once && inst.once('onDestroy', function () {
      unsubscribeEvents(inst, parent, eventsList);
   });
}
