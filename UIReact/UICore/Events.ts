/**
 * Библиотека событий
 * @includes WasabyEvents UICore/_events/WasabyEvents
 * @includes WasabyEventsSingleton UICore/_events/WasabyEventsSingleton
 * @includes Notify UICore/_events/Notify
 * @includes Hooks UICore/_events/Hooks
 * @author Тэн В.А.
 */

export { default as WasabyEvents } from './_events/WasabyEvents';
export { WasabyEventsSingleton } from './_events/WasabyEventsSingleton';
export { callNotify } from './_events/Notify';
export { setEventHook } from './_events/Hooks';
