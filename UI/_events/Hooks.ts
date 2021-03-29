import {
    IEvent,
    IProperties,
    IWasabyHTMLElement,
    TEventsObject
} from 'UI/_vdom/Synchronizer/interfaces';

import {EventUtils, IWasabyEventSystem} from '../Events';
import { Set } from 'Types/shim';

type TRef = (element?: HTMLElement & {
    eventProperties?: TEventsObject;
    eventPropertiesCnt?: number;
}) => void;
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

function clearInputValue(element: HTMLElement): void {
    if (element && isInputElement(element)) {
        delete element.value;
    }
}

function haveEvents(events: TEventsObject): boolean {
    return events && Object.keys(events).length > 0;
}

function eventDescrAttach(elementEvents: IEvent[], eventDescriptionArray: IEvent[]): IEvent[] {
    const eventDescriptionFirstValue = eventDescriptionArray[0] && eventDescriptionArray[0].value;
    return elementEvents.filter((event) => eventDescriptionFirstValue === event.value);
}

function addEventsToElement(
    events: TEventsObject,
    eventSystem: IWasabyEventSystem,
    element: HTMLElement & {
        eventProperties?: TEventsObject;
        eventPropertiesCnt?: number;
    }
): void {
    if (!element.eventProperties) {
        element.eventProperties = {};
        element.eventPropertiesCnt = 0;
    }
    const eventProperties: TEventsObject = element.eventProperties;

    const eventFullNamesNames: string[] = Object.keys(events);
    for (let i = 0; i < eventFullNamesNames.length; i++) {
        const eventFullName: string = eventFullNamesNames[i];
        const eventValue: IEvent[] = events[eventFullName];
        const eventName = EventUtils.getEventName(eventFullName);
        let eventDescrArray: IEvent[] = eventValue.map((event: IEvent): IEvent => {
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

function removeEventsFromElement(
    events: TEventsObject,
    eventSystem: IWasabyEventSystem,
    element: HTMLElement & {
        eventProperties?: TEventsObject;
        eventPropertiesCnt?: number;
    }
): void {
    let eventProperties: TEventsObject = element.eventProperties;
    const eventFullNamesNames: string[] = Object.keys(events);
    for (let i = 0; i < eventFullNamesNames.length; i++) {
        const eventFullName: string = eventFullNamesNames[i];
        const eventName = EventUtils.getEventName(eventFullName);
        eventSystem.removeCaptureEventHandler(eventName, element);
        if (eventProperties) {
            delete eventProperties[eventFullName];
            element.eventPropertiesCnt--;
            if (element.eventPropertiesCnt === 0) {
                delete element.eventPropertiesCnt;
                delete element.eventProperties;
                eventProperties = null;
            }
        }
    }
}

export function setEventHook(
    tagName: string,
    props: IProperties,
    element: HTMLElement & {
        eventProperties?: TEventsObject;
        eventPropertiesCnt?: number;
    },
    eventSystem: IWasabyEventSystem,
): void {
    const events: TEventsObject = props.events;
    let savedElement: HTMLElement;
    if (!haveEvents(events)) {
        return;
    }
    element.eventProperties = events;
    const currentEventRef: TRef = function eventRef(element: HTMLElement): void {
        const haveElement = !!element;
        const updateEventsOnElementFn = haveElement ? addEventsToElement : removeEventsFromElement;
        if (haveElement) {
            savedElement = element;
        }
        updateEventsOnElementFn(events, eventSystem, savedElement);
    };

    const finalCurrentEventRef: TRef = inputTagNames.has(tagName) ?
        function clearInputValueRef(element: HTMLElement): void {
            if (currentEventRef) {
                currentEventRef(element);
            }
            if (!element) {
                clearInputValue(savedElement);
            }
        } :
        currentEventRef;

    finalCurrentEventRef(element);

}
