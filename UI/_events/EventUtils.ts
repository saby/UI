/// <amd-module name="UI/_events/EventUtils" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

const originDOMEventNames = {
   mozmousepixelscroll: "MozMousePixelScroll",
   domautocomplete: "DOMAutoComplete"
};

const passiveFalseEvents = ["wheel", "mousewheel"];
const passiveTrueEvents = ["touchstart", "touchmove"];
const specialBodyEvents = ["scroll", "resize"];

export function isEvent(titleAttribute) {
   return /^(on:[A-z0-9])\w*$/.test(titleAttribute);
}

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
export function checkPassiveTrueEvents(eventName): boolean {
   return passiveTrueEvents.indexOf(eventName) !== -1;
}

/**
 * Проверяем, входит ли событие в список событий, которые стреляют на window, а не на document'е
 * @param eventName - имя события
 * @returns {boolean}
 */
export function isSpecialBodyEvent(eventName): boolean {
   return specialBodyEvents.indexOf(eventName) !== -1;
}

export function fixUppercaseDOMEventName(name) {
   var fixedName = originDOMEventNames[name];
   return fixedName || name;
}
