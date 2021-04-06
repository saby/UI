/// <amd-module name="UICommon/_events/EventUtils" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

const originDOMEventNames = {
   mozmousepixelscroll: "MozMousePixelScroll",
   domautocomplete: "DOMAutoComplete"
};

const passiveFalseEvents = ["wheel", "mousewheel", "touchstart", "touchmove"];
const specialBodyEvents = ["scroll", "resize"];

/**
 * Проверка атрибута что это подписка на событие (on:event)
 * @param titleAttribute
 * @returns {boolean}
 */
export function isEvent(titleAttribute) {
   return /^(on:[A-z0-9])\w*$/.test(titleAttribute);
}

/**
 * Получение имени события
 * @param eventAttribute
 * @returns {string}
 */
export function getEventName(eventAttribute) {
   return eventAttribute.slice(3).toLowerCase();
}

/**
 * Начиная с 73.0.3683.56 версии хрома, обработчики на события wheel/mousewheel, зарегистрированные на документе
 * автоматически пометятся параметром passive(это значит, что preventDefault в них не будет работать).
 * Нас такое поведение не устраивает, так как есть кейсы, когда preventDefault вызывается и должен работать.
 * Эта функция возвращает true, если eventName - mousewheel или wheel.
 * @param eventName - имя события
 * @returns {boolean}
 */
export function checkPassiveFalseEvents(eventName): boolean {
   return passiveFalseEvents.indexOf(eventName) !== -1;
}

/**
 * Проверяем, входит ли событие в список событий, которые стреляют на window, а не на document'е
 * @param eventName - имя события
 * @returns {boolean}
 */
export function isSpecialBodyEvent(eventName): boolean {
   return specialBodyEvents.indexOf(eventName) !== -1;
}

/**
 * Исправление регистра в имени событий для из списка originDOMEventNames
 * @param name
 * @returns {boolean}
 */
export function fixUppercaseDOMEventName(name) {
   const fixedName = originDOMEventNames[name];
   return fixedName || name;
}

//TODO: https://online.sbis.ru/opendoc.html?guid=9f8133e8-5aaf-4b95-897f-00160c512daf
/**
 * Обработчик используется в шаблонах для проксирования событий логическому родителю.
 * @param event
 * @param eventName
 * returns {Function}
 */
export function tmplNotify(event: Event, eventName: string) {
   /**
    * We can't ignore bubbling events here, because no one guarantees they're the same.
    * E.g. on:myEvent="_tmplNotify('anotherEvent')"
    * Here, event gets forwarded but under a different name.
    */
   const args = Array.prototype.slice.call(arguments, 2);
   return this._notify(eventName, args);
}

/**
 * Транслирует переданные события модели от переданного контрола
 * @param component
 * @param model
 * @param eventNames
 * returns {void}
 */
export function proxyModelEvents(component, model, eventNames: string[]) {
   eventNames.forEach((eventName: string) => {
      model.subscribe(eventName, (event, value) => {
         component._notify(eventName, value);
      });
   });
}

/**
 * Используется в контролах для обработки события keyDown
 * @param event
 * @param keys
 * @param handlerSet
 * @param scope
 * @param dontStop
 * returns {void}
 */
export function keysHandler(event, keys, handlerSet, scope: object, dontStop: boolean): void {
   for (const action in keys) {
      if (keys.hasOwnProperty(action)) {
         if (event.nativeEvent.keyCode === keys[action]) {
            handlerSet[action](scope, event);

            // Так как наша система событий ловит события на стадии capture,
            // а подписки в БТРе на стадии bubbling, то не нужно звать stopPropagation
            // так как обработчики БТРа в таком случае не отработают, потому что
            // у события не будет bubbling фазы
            // TODO: will be fixed https://online.sbis.ru/opendoc.html?guid=cefa8cd9-6a81-47cf-b642-068f9b3898b7
            if (!dontStop) {
               if (event.target.closest('.richEditor_TinyMCE')) {
                  event._bubbling = false;
               } else {
                  event.stopImmediatePropagation();
               }
            }
            return;
         }
      }
   }
}
