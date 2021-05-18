/// <amd-module name="UICore/_base/startApplication" />
import { default as AppInit, isInit } from 'Application/Initializer';
import { StateReceiver } from 'Application/State';
import { Serializer } from 'UICommon/State';

/**
 * Инициализация Application/Env для Sbis приложения
 * @param {Record<string, any>} Настройки приложения
 */

// tslint:disable-next-line:no-any
export default function startApplication(cfg?: Record<string, any>): void {
    if (isInit()) {
        return;
    }

    // tslint:disable-next-line:no-string-literal
    const config = cfg || window && window['wsConfig'];

    const stateReceiverInst = new StateReceiver(Serializer);
    AppInit(config, void 0, stateReceiverInst);
    // tslint:disable-next-line:no-string-literal
    if (typeof window !== 'undefined' && window['receivedStates']) {
        // tslint:disable-next-line:no-string-literal
        stateReceiverInst.deserialize(window['receivedStates']);
    }
}

/**
 * Возвращаем ноду, от которой начинаем строить.
 * UIInferno заменяет переданный компонент.
 * @param node HTMLElement
 */
export function selectRenderDomNode(node: HTMLElement): HTMLElement {
    return (node.firstElementChild || node.firstChild) as HTMLElement;
}
