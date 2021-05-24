/**
 * @author Тэн В.А.
 */
import { Component } from "react";

import { Control } from 'UICore/Base';
import { WasabyEventsSingleton } from './WasabyEventsSingleton';
import { WasabyEventsDebug } from './WasabyEventsDebug';
import { Logger } from 'UI/Utils';

function getControlNode(inst: Control) {
    if (!inst._container) {
        const errorName = inst._moduleName === 'Controls/Container/Async' ? 'Async: ' + inst.currentTemplateName : inst._moduleName;
        Logger.error(`[WasabyEvents] У контрола ${ errorName } отсутствует контейнер. ControlNode не может быть вычислен.`, inst);
        WasabyEventsDebug.debugNotify(inst, errorName).attach();
        return false;
    }
    const controlNodes = inst._container.controlNodes;
    const controlNodeForInst = controlNodes.filter((node) =>  node.control === inst);
    if (Array.isArray(controlNodeForInst)) {
        return controlNodeForInst[0];
    }
    return controlNodeForInst;
}
/**
 * запускает нотифай события (для wasabyOverReact)
 * @param inst
 * @param eventName
 * @param args
 * @param options
 * @returns {unknown}
 */
export function callNotify<T extends Component = Control>(
    inst: T & {eventTarget: HTMLElement},
    eventName: string,
    args?: unknown[],
    options?: { bubbling?: boolean }
): unknown {
    const eventSystem = WasabyEventsSingleton.getEventSystem();
    Array.prototype.splice.call(arguments, 0, 1);
    const controlNode = getControlNode(inst);
    if (controlNode) {
        return eventSystem.startEvent(controlNode, arguments);
    }
    Logger.error(`[WasabyEvents] Не удалось запустить _notify события ${ eventName }`, inst);

}
