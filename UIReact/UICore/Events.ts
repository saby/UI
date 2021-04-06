/**
 * Библиотека событий
 * @library UICore/Events
 * @includes WasabyEvents UICore/_events/WasabyEvents
 * @includes Notify UICore/_events/Notify
 * @includes Hooks UICore/_events/Hooks
 * @public
 * @author Тэн В.А.
 */

export { default as WasabyEvents } from './_events/WasabyEvents';
export { callNotify } from './_events/Notify';
export { setEventHook } from './_events/Hooks';
