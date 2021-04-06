import { IWasabyHTMLElement } from 'UICommon/interfaces';

import { EventUtils, IWasabyEventSystem } from '../Events';
import {  IWasabyEvent } from 'UIReact/UICore/_executor/_Markup/Vdom/interfaces';

import { Set } from 'Types/shim';

type TElement =  HTMLElement & {
    eventProperties?: Record<string, IWasabyEvent[]>;
    eventPropertiesCnt?: number;
}
type TWasabyInputElement = HTMLInputElement & IWasabyHTMLElement;

/**
 * @author Тэн В.А.
 */

const inputTagNames = new Set([
    'input',
    'INPUT',
    'textarea',
    'TEXTAREA'
]);

function isInputElement(element: HTMLElement): element is TWasabyInputElement {
    return inputTagNames.has(element.tagName);
}

function clearInputValue(element: HTMLElement & {value?: unknown}): void {
    if (element && isInputElement(element)) {
        delete element.value;
    }
}

function haveEvents(events: Record<string, IWasabyEvent[]>): boolean {
    return events && Object.keys(events).length > 0;
}

function eventDescrAttach(elementEvents: IWasabyEvent[], eventDescriptionArray: IWasabyEvent[]): IWasabyEvent[] {
    const eventDescriptionFirstValue = eventDescriptionArray[0] && eventDescriptionArray[0].value;
    return elementEvents.filter((event) => eventDescriptionFirstValue === event.value);
}

function prepareEvents(events) {
    Object.keys(events).forEach((eventName) => {
        const eventArr = events[eventName];
        eventArr.forEach((event) => {
            if (event.args) {
                event.fn = function (eventObj) {
                    const context = event.context.apply(this.viewController);
                    const handler = event.handler.apply(this.viewController);
                    if (typeof handler === 'undefined') {
                        throw new Error(`Отсутствует обработчик ${ event.value } события ${ eventObj.type } у контрола ${ event.viewController._moduleName }`);
                    }
                    const res = handler.apply(context, arguments);
                    if(res !== undefined) {
                        eventObj.result = res;
                    }
                };
            } else {
                event.fn = function (eventObj, value) {
                    if (!event.handler(this.viewController, value)) {
                        event.handler(this.data, value)
                    }
                };
            }

            event.fn = event.fn.bind({
                viewController: event.viewController,
                data: event.data
            });
            event.fn.control = event.viewController;
        });
    });
}

function addEventsToElement(
    events: Record<string, IWasabyEvent[]>,
    eventSystem: IWasabyEventSystem,
    element: TElement
): void {
    if (!element.eventProperties) {
        element.eventProperties = {};
        element.eventPropertiesCnt = 0;
    }
    const eventProperties: Record<string, IWasabyEvent[]> = element.eventProperties;

    const eventFullNamesNames: string[] = Object.keys(events);
    for (let i = 0; i < eventFullNamesNames.length; i++) {
        const eventFullName: string = eventFullNamesNames[i];
        const eventValue: IWasabyEvent[] = events[eventFullName];
        const eventName = EventUtils.getEventName(eventFullName);
        let eventDescrArray: IWasabyEvent[] = eventValue.map((event: IWasabyEvent): IWasabyEvent => {
            return event;
        });
        if (eventProperties[eventFullName]) {
            const elementEvents = eventDescrAttach(eventProperties[eventFullName], eventDescrArray);
            if (eventProperties[eventFullName] && elementEvents.length === 0) {
                eventDescrArray = eventDescrArray.concat(eventProperties[eventFullName]);
            }
        } else {
            element.eventPropertiesCnt++;
        }

        eventProperties[eventFullName] = eventDescrArray;
        eventSystem.addCaptureEventHandler(eventName, element);
    }
}

export function setEventHook(
    tagName: string,
    props: {
        events: Record<string, IWasabyEvent[]>;
        eventSystem?: IWasabyEventSystem;
    },
    element: TElement
): void {
    const events = props.events;
    const eventSystem = props.eventSystem;
    prepareEvents(events);
    if (!haveEvents(events)) {
        return;
    }
    element.eventProperties = events;
    if (!!element) {
        addEventsToElement(events, eventSystem, element)
    }
    if (!element) {
        clearInputValue(element);
    }
}
