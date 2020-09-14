/**
 * Библиотека горячих клавиш
 * @library UI/HotKey
 * @includes Dispatcher UI/_hotkey/Dispatcher
 * @includes KeyHook UI/_hotkey/KeyHook
 * @includes KeyStop UI/_hotkey/KeyStop
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
