/**
 * @author Тэн В.А.
 */
import { Component } from "react";

import { Control } from 'UICore/Base';
import { findEventSystem } from './FindEventSystem';

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
    const eventSystem = findEventSystem(inst.eventTarget);
    // FIXME https://online.sbis.ru/opendoc.html?guid=1702cde9-2108-4ac6-8095-0566d7a3758c
    if (!eventSystem) { return; }
    Array.prototype.splice.call(arguments, 0, 1);
    return eventSystem.startEvent(inst, arguments);
}
