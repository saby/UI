import { Control } from 'UI/Base';
import { dispatcherHandler, ISyntheticEvent } from 'UI/Utils';
import template = require('wml!UI/_hotKeys/Dispatcher');

/**
 * Контрол выделяет область, в которой будут перехватываться клавиши и перенаправляться на обработку дочернему контролу,
 * который зарегистрировал себя на обработку этих клавиш с помощью контрола UI/HotKeys:KeyHook.
 * Облатсь содержимого body также выделена контролом UI/HotKeys:Dispatcher
 */
class Dispatcher extends Control {
   keyDownHandler(event: ISyntheticEvent): void {
      return dispatcherHandler(event);
   }
}

// @ts-ignore
Dispatcher.prototype._template = template;

export default Dispatcher;
