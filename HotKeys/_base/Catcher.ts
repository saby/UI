// @ts-ignore
import { Control } from 'UI/Base';
// @ts-ignore
import template = require('wml!HotKeys/_base/Catcher');
// @ts-ignore
import { DOMEnvironment } from 'Vdom/Vdom';
// @ts-ignore
import { constants } from 'Env/Env';

/**

 */
class Catcher extends Control {
    keyDownHandler(event): void {
        // если isTrusted = false, значит это мы запустили событие по горячим клавишам, его не надо повторно обрабатывать
        // клавиши home и end не обрабатываем, у поля ввода есть реакция на эти клавиши
        if (event.nativeEvent.isTrusted) {
            var nativeEvent = event.nativeEvent;
            var parents = DOMEnvironment._goUpByControlTree(nativeEvent.target);
            for (var i = 0; i < parents.length; i++) {
                var parent = parents[i];
                var key = 'which' in nativeEvent ? nativeEvent.which : nativeEvent.keyCode;
                if (parent._$defaultActions && parent._$defaultActions[key]) {
                    parent._$defaultActions[key].action();
                    break;
                }
            }
        }
        event.stopPropagation();
    }
}

// @ts-ignore
Catcher.prototype._template = template;

export default Catcher;