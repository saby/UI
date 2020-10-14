/**
 * Библиотека горячих клавиш
 * @library UI/HotKey
 * @includes Dispatcher UI/_hotKeys/Dispatcher
 * @includes KeyHook UI/_hotKeys/KeyHook
 * @includes KeyStop UI/_hotKeys/KeyStop
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
