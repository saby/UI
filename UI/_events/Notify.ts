/**
 * @author Тэн В.А.
 */
import {Component} from "react";

import { IWasabyEventSystem } from './IEvents';
import { Control } from 'UI/ReactComponent';

/**
 * запускает нотифай события (для wasabyOverReact)
 * @param eventSystem
 * @param inst
 * @param eventName
 * @param args
 * @param options
 * @returns {unknown}
 */
export function callNotify<T extends Component = Control>(
    eventSystem: IWasabyEventSystem,
    inst: T,
    eventName: string,
    args?: unknown[],
    options?: { bubbling?: boolean }
): unknown {
    Array.prototype.splice.call(arguments, 0, 2);
    return eventSystem.startEvent(inst, arguments);
}
