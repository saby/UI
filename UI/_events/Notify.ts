/**
 * @author Тэн В.А.
 */

import { IWasabyEventSystem } from './IEvents';

/**
 * запускает нотифай события (для wasabyOverReact)
 * @param eventSystem
 * @param inst
 * @param eventName
 * @param args
 * @param options
 * @returns {unknown}
 */
export function callNotify<TControl>(
    eventSystem: IWasabyEventSystem,
    inst: TControl,
    eventName: string,
    args?: unknown[],
    options?: { bubbling?: boolean }
): unknown {
    Array.prototype.splice.call(arguments, 0, 2);
    return eventSystem.startEvent(inst, arguments);
}
