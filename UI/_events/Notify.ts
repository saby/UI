/**
 * @author Тэн В.А.
 */

import { IWasabyEventSystem } from 'UICommon/Events';
import { Control } from 'UIReact/UICore/Base';

/**
 * запускает нотифай события (для wasabyOverReact)
 * @param eventSystem
 * @param inst
 * @param eventName
 * @param args
 * @param options
 * @returns {unknown}
 */
export function callNotify(
    eventSystem: IWasabyEventSystem,
    inst: Control,
    eventName: string,
    args?: unknown[],
    options?: { bubbling?: boolean }
): unknown {
    Array.prototype.splice.call(arguments, 0, 2);
    // пока этот код используется в актуальной системе событий wasaby типы менять нельзя
    return eventSystem.startEvent(inst as any, arguments);
}
