// @ts-ignore
import { Control } from 'UI/Base';
// @ts-ignore
import template = require('wml!UI/_hotKeys/KeyHook');
// @ts-ignore
import { goUpByControlTree } from 'UI/Focus';
// @ts-ignore
import Dispatcher from './Dispatcher';

/**
 * Создание события нажатия определенной клавиши
 */
function createEvent(key: string): object {
    let eventObj;
    if (document.createEventObject) {
        eventObj = document.createEventObject();
        eventObj.keyCode = key;
    } else if (document.createEvent) {
        eventObj = document.createEvent('Events');
        eventObj.initEvent('keydown', true, true);
        eventObj.which = key;
        eventObj.keyCode = key;
    }
    return eventObj;
}

/**
 * Контрол KeyHook - контрол, который указывает клавиши, нажатие на которые будет обработано по умолчанию дочерним
 * контролом. Он регистрирует клавиши по умолчанию для всех предков, у которых еще нет зарегистрированного действия на
 * эту клавишу, и, в случае необработанного нажатия этих клавиш, в дочерний контрол будет перенаправлено событие о
 * нажатии на клавишу, и там будет обработано.
 */
class KeyHook extends Control {
    // набор действий по умолчанию, зарегистрированных на определенные клавиши
    private _actions: object = {};

    _afterMount(): void {
        // опция defaultActions хранит набор клавиш, которые будут обработаны по умолчанию
        if (this._options.defaultActions) {
           // регистрируем только в пределах попапа
           // todo придумать проверку получше https://online.sbis.ru/opendoc.html?guid=50215de6-da5c-44bf-b6f6-a9f7cb0e17d2
            const wholeParents = goUpByControlTree(this._container);
            const popupIndex = wholeParents.findIndex((parent) => parent._moduleName === 'Controls/_popup/Manager/Popup');
            const parents = popupIndex === -1 ? wholeParents : wholeParents.slice(0, popupIndex + 1);

           // собираем всех предков, и говорим им, какое действие по умолчанию нужно выполнить на необработанное
            // нажатие клавиш
            this._options.defaultActions.forEach((action) => {
                for (let i = 0; i < parents.length; i++) {
                    const parent = parents[i];

                    // если у контрола уже есть зарегистрированное действие по умолчанию на эту клавишу,
                    // перестаем регистрацию
                    if (parent._$defaultActions && parent._$defaultActions[action.keyCode]) {
                        break;
                    }
                    // выше контрола Dispatcher не регистрируем. Dispatcher ограничивает область перехвата и
                    // регистрации действий по умолчанию.
                    if (parent.constructor === Dispatcher) {
                        break;
                    }
                    parent._$defaultActions = parent._$defaultActions || {};

                    // действием по умолчанию будет отправка события нажатия на клавишу по умолчанию,
                    // это событие будет всплывать от контрола, обернутого в KeyHook.
                    // таким образом мы как бы перенаправляем событие нажатия клавиши из места, где оно не
                    // обработано - в место, где оно обрабатывается по умолчанию.
                    this._actions[action.keyCode] = this._actions[action.keyCode] || {
                        action: () => {
                            const event = createEvent(action.keyCode);
                            this._container.dispatchEvent(event);
                        }
                    };

                    parent._$defaultActions[action.keyCode] = this._actions[action.keyCode];
                }
            });
        }
    }
    _beforeUnmount(): void {
        // при удалении контрола произведем разрегистрацию.
        if (this._options.defaultActions) {
            const parents = goUpByControlTree(this._container);
            this._options.defaultActions.forEach((action) => {
                for (let i = 0; i < parents.length; i++) {
                    const parent = parents[i];
                    const curAction = this._actions[action.keyCode];
                    if (parent._$defaultActions && parent._$defaultActions[action.keyCode] === curAction) {
                        delete parent._$defaultActions[action.keyCode];
                    } else {
                        break;
                    }
                }
            });
        }
    }
}

// @ts-ignore
KeyHook.prototype._template = template;

export default KeyHook;
