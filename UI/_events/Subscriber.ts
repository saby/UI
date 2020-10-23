/// <amd-module name="UI/_events/Subscriber" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

/**
 * Create function for event binding.
 *
 * @param func - function for launch
 * @param ctx - context launching
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
 * Extract events from options object.
 *
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
 * Iterate over event objects in event list.
 *
 * @param eventsList
 * @param func
 *    - executes for each (key, object) pair
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
 * Subscribe instance to all events in the list.
 *
 * @param inst
 * @param parent
 * @param eventsList
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
 * Unsubscribe instance from all events in the list.
 *
 * @param inst
 * @param parent
 * @param eventsList
 */
export function unsubscribeEvents(inst, parent, eventsList) {
   forEventObjects(eventsList, function (key, eventObject) {
      if (eventObject.bindedFunc) {
         inst.unsubscribe(key.split(':')[1], eventObject.bindedFunc);
      }
   });
}

/**
 * Apply events to the given instance:
 *    1. Subscribe events to the instance
 *    2. Unsubscribe events when instance is destroyed
 *
 * @param inst
 * @param parent
 * @param eventsList
 */
export function applyEvents(inst, parent, eventsList) {
   subscribeEvents(inst, parent, eventsList);
   inst.once && inst.once('onDestroy', function () {
      unsubscribeEvents(inst, parent, eventsList);
   });
}