import { IWasabyHTMLElement } from 'UI/_vdom/Synchronizer/interfaces';

import { EventUtils, IWasabyEventSystem, IWasabyEvent } from '../Events';

import { Set } from 'Types/shim';

type TRef = (element?: HTMLElement & {
    eventProperties?: {[key: string]: IWasabyEvent[]};
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

function clearInputValue(element: HTMLElement & {value?: unknown}): void {
    if (element && isInputElement(element)) {
        delete element.value;
    }
}

function haveEvents(events: {[key: string]: IWasabyEvent[]}): boolean {
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
    events: {[key: string]: IWasabyEvent[]},
    eventSystem: IWasabyEventSystem,
    element: HTMLElement & {
        eventProperties?: {[key: string]: IWasabyEvent[]};
        eventPropertiesCnt?: number;
    }
): void {
    if (!element.eventProperties) {
        element.eventProperties = {};
        element.eventPropertiesCnt = 0;
    }
    const eventProperties: {[key: string]: IWasabyEvent[]} = element.eventProperties;

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

function removeEventsFromElement(
    events: {[key: string]: IWasabyEvent[]},
    eventSystem: IWasabyEventSystem,
    element: HTMLElement & {
        eventProperties?: {[key: string]: IWasabyEvent[]};
        eventPropertiesCnt?: number;
    }
): void {
    let eventProperties: {[key: string]: IWasabyEvent[]} = element.eventProperties;
    const eventFullNamesNames: string[] = Object.keys(events);
    for (let i = 0; i < eventFullNamesNames.length; i++) {
        const eventFullName: string = eventFullNamesNames[i];
        const eventName = EventUtils.getEventName(eventFullName);
        eventSystem.removeCaptureEventHandler(eventName, element as unknown as IWasabyHTMLElement);
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

export function setEventHook<T extends HTMLElement>(
    tagName: string,
    props: {
        events?: {
            [key: string]: IWasabyEvent[]
        };
        eventSystem?: IWasabyEventSystem;
    },
    element: T & {
        eventProperties?: {[key: string]: IWasabyEvent[]};
        eventPropertiesCnt?: number;
    }
): void {
    const events = props.events;
    const eventSystem = props.eventSystem;
    prepareEvents(events);
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
