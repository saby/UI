import { Control } from 'UICore/Base';
import { dispatcherHandler, ISyntheticEvent } from './dispatcherHandler';

// @ts-ignore
import template = require('wml!UICore/_hotKeys/Dispatcher');

/**
 * Контрол выделяет область, в которой будут перехватываться клавиши и перенаправляться на обработку дочернему контролу,
 * который зарегистрировал себя на обработку этих клавиш с помощью контрола UICore/HotKeys:KeyHook.
 * Облатсь содержимого body также выделена контролом UICore/HotKeys:Dispatcher
 * @class UICore/_hotKeys/Dispatcher
 * @extends UICore/Base:Control
 * @public
 * @author Тэн В.А.
 */
class Dispatcher extends Control {
   keyDownHandler(event: ISyntheticEvent): void {
      return dispatcherHandler(event);
   }
}

// @ts-ignore
Dispatcher.prototype._template = template;

export default Dispatcher;
