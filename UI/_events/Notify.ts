/// <amd-module name="UI/_events/Notify" />

/**
 * @author Тэн В.А.
 */

import {IWasabyEventSystem} from './IEvents';

/**
 * запускает нотифай события (для wasabyOverReact)
 * @param eventSystem
 * @param eventName
 * @param args
 * @param options
 * @returns {unknown}
 */
export function callNotify(
    eventSystem: IWasabyEventSystem,
    eventName: string,
    args?: unknown[],
    options?: { bubbling?: boolean }
): unknown {
    Array.prototype.splice.call(arguments, 0, 1);
    return eventSystem.startEvent(null, arguments);
}
