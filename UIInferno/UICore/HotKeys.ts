/**
 * Библиотека горячих клавиш
 * @library UICore/HotKey
 * @includes Dispatcher UICore/_hotKeys/Dispatcher
 * @includes KeyHook UICore/_hotKeys/KeyHook
 * @includes KeyStop UICore/_hotKeys/KeyStop
 * @public
 * @author Тэн В.А.
 */
import KeyHook from './_hotKeys/KeyHook';
import Dispatcher from './_hotKeys/Dispatcher';
import KeyStop from './_hotKeys/KeyStop';
import { dispatcherHandler } from './_hotKeys/dispatcherHandler';
export { ISyntheticEvent } from './_hotKeys/dispatcherHandler';

export {
   KeyHook,
   Dispatcher,
   KeyStop,
   dispatcherHandler
};
