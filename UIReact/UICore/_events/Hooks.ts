import { IWasabyHTMLElement } from 'UICommon/interfaces';

import { EventUtils, IWasabyEventSystem, IWasabyEvent } from 'UICommon/Events';
import { WasabyEventsSingleton } from './WasabyEventsSingleton';
import { Control } from 'UICore/Control';

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
                    context.eventTarget = eventObj.target;
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

function findEventProperties(newEvents, eventProperties) {
    const newEventsKey = Object.keys(newEvents);
    const eventPropertiesKey  = Object.keys(eventProperties);

    if (newEventsKey.length !== eventPropertiesKey.length) {
        return false;
    }

    for (let key of newEventsKey) {
        if (!eventProperties.hasOwnProperty(key)) {
            return false;
        }
        if (newEvents[key].fn !== eventProperties[key].fn && newEvents[key].value !== eventProperties[key].value ) {
            return false;
        }
    }

    return true;
}

export function setEventHook(
    tagName: string,
    props: {
        events: Record<string, IWasabyEvent[]>;
    },
    element: TElement | Control
): void {
    const domElement = element._container || element;
    const events = props.events;
    const eventSystem = WasabyEventsSingleton.getEventSystem();
    prepareEvents(events);
    if (!haveEvents(events)) {
        return;
    }
    const origEventProperties = domElement.eventProperties || {};
    domElement.eventProperties = events;
    if (!findEventProperties(events, origEventProperties)) {
        domElement.eventProperties = mergeEvents(origEventProperties, events);
    }
    if (!!domElement) {
        addEventsToElement(events, eventSystem, domElement)
    }
    if (!domElement) {
        clearInputValue(domElement);
    }
}


export function mergeEvents(currentEvents, newEvents) {
    let mergedEvents = currentEvents;
    const newEventsKeys = Object.keys(newEvents);

    for (let key of newEventsKeys) {
        if (!currentEvents.hasOwnProperty(key)) {
            mergedEvents[key] = newEvents[key];
            continue;
        }
        if (currentEvents[key].fn !== newEvents[key].fn && currentEvents[key].value !== newEvents[key].value ) {
            mergedEvents[key].push(newEvents[key]);
        }
    }
    return mergedEvents;
}
