import { Event } from 'View/Executor/Expressions';
import { IWasabyHTMLElement, IControlNode, IEvent, TEventsObject, TControlId } from '../interfaces';
import { IDOMEnvironment, IProperties } from './DOMEnvironment';
import isInvisibleNode from './InvisibleNodeChecker';
import { constants } from 'Env/Env';
import { Set } from 'Types/shim';

/**
 * @author Кондаков Р.Н.
 */

export type TRef = (element?: IWasabyHTMLElement) => void;
export type TWasabyInputElement = HTMLInputElement & IWasabyHTMLElement;
const inputTagNames = new Set([
    'input',
    'INPUT',
    'textarea',
    'TEXTAREA'
]);

function isInputElement(element: IWasabyHTMLElement): element is TWasabyInputElement {
    return inputTagNames.has(element.tagName);
}

function clearInputValue(element: IWasabyHTMLElement): void {
    if (element && isInputElement(element)) {
        element.value = '';
    }
}

function updateControlNodes(
    element: IWasabyHTMLElement,
    controlNode: IControlNode,
    fn: (controlNodes: IControlNode[], controlNode: IControlNode) => void
): void {
    if (!element) {
        return;
    }

    const controlNodes = element.controlNodes || [];
    element.controlNodes = controlNodes;

    fn(controlNodes, controlNode);

    for (let i = 0; i < controlNodes.length; i++) {
        controlNodes[i].element = element;
        if (constants.compat) {
            // tslint:disable-next-line
            // @ts-ignore TODO опции protected, их нельзя так использовать
            controlNodes[i].control.saveOptions(controlNodes[i].control._options, controlNodes[i]);
        } else {
            // tslint:disable-next-line
            // @ts-ignore TODO контейнер protected, его нельзя так использовать
            controlNodes[i].control._container = element;
        }
    }
}

function getNumberId(id: TControlId | 0): number {
    return parseInt((id + '').replace('inst_', ''), 10);
}

function sortedAddControlNode(controlNodes: IControlNode[], newControlNode: IControlNode): void {
    const newId: number = getNumberId(newControlNode.id);

    // Если массив пустой или все айди не меньше, чем у новой ноды - добавляем в конец.
    let newIndex: number = controlNodes.length;
    for (let index = 0; index < controlNodes.length; ++index) {
        const id = getNumberId(controlNodes[index].id);

        // Добавляем ноду перед первой из тех, чей айди меньше.
        if (id < newId) {
            newIndex = index;
            break;
        }
    }
    controlNodes.splice(newIndex, 0, newControlNode);
}

function addControlNode(controlNodes: IControlNode[], controlNode: IControlNode): void {
    const controlNodeIdx = controlNodes.indexOf(controlNode);
    const haveNode = controlNodeIdx !== -1;
    if (!haveNode) {
        sortedAddControlNode(controlNodes, controlNode);
    }
}

function removeControlNode(controlNodes: IControlNode[], controlNodeToRemove: IControlNode): void {
    const controlNodeIdx = controlNodes.indexOf(controlNodeToRemove);
    const haveNode = controlNodeIdx !== -1;
    if (haveNode) {
        controlNodes.splice(controlNodeIdx, 1);
    }
}

function eventDescrAttach(elementEvents: IEvent[], eventDescriptionArray: IEvent[]): IEvent[] {
    const eventDescriptionFirstValue = eventDescriptionArray[0] && eventDescriptionArray[0].value;
    return elementEvents.filter((event) => eventDescriptionFirstValue === event.value);
}

function haveEvents(events: TEventsObject): boolean {
    return events && Object.keys(events).length > 0;
}

function addEventsToElement(
    controlNode: IControlNode,
    events: TEventsObject,
    environment: IDOMEnvironment,
    element: IWasabyHTMLElement
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
        const eventName = Event.getEventName(eventFullName);
        let eventDescrArray: IEvent[] = eventValue.map((event: IEvent): IEvent => {
            event.controlNode = controlNode;
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
        environment.addCaptureEventHandler(eventName, element);
    }
}

function removeEventsFromElement(
    controlNode: IControlNode,
    events: TEventsObject,
    environment: IDOMEnvironment,
    element: IWasabyHTMLElement
): void {
    let eventProperties: TEventsObject = element.eventProperties;
    const eventFullNamesNames: string[] = Object.keys(events);
    for (let i = 0; i < eventFullNamesNames.length; i++) {
        const eventFullName: string = eventFullNamesNames[i];
        const eventName = Event.getEventName(eventFullName);
        environment.removeCaptureEventHandler(eventName, element);
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

export function setControlNodeHook(
    tagName: string,
    props: IProperties,
    children: IControlNode[],
    key: TControlId | 0,
    controlNode: IControlNode,
    ref?: TRef
): [string, IProperties, IControlNode[], TControlId | 0, TRef] {
    const environment: IDOMEnvironment = controlNode.environment;
    let savedElement: IWasabyHTMLElement;

    const currentControlRef: TRef = function controlRef(element: IWasabyHTMLElement): void {
        const haveElement: boolean = !!element;
        const events: TEventsObject = controlNode.events;
        const updateEventsOnElementFn = haveElement ? addEventsToElement : removeEventsFromElement;
        const updateControlNodesFn = haveElement ? addControlNode : removeControlNode;
        if (haveElement) {
            savedElement = element;
        }
        if (ref) {
            ref(element);
        }
        if (isInvisibleNode(controlNode) && haveEvents(events)) {
            updateEventsOnElementFn(controlNode, events, environment, savedElement);
        }
        updateControlNodes(savedElement, controlNode, updateControlNodesFn);
    };

    return [tagName, props, children, key, currentControlRef];
}

export function setEventHook(
    tagName: string,
    props: IProperties,
    children: IControlNode[],
    key: TControlId | 0,
    controlNode: IControlNode,
    ref?: TRef
): [string, IProperties, IControlNode[], TControlId | 0, TRef] {
    const events: TEventsObject = props.events;
    const environment: IDOMEnvironment = controlNode.environment;
    let savedElement: IWasabyHTMLElement;

    const currentEventRef: TRef = haveEvents(events) ? function eventRef(element: IWasabyHTMLElement): void {
        const haveElement = !!element;
        const updateEventsOnElementFn = haveElement ? addEventsToElement : removeEventsFromElement;
        if (haveElement) {
            savedElement = element;
        }
        if (ref) {
            ref(element);
        }
        updateEventsOnElementFn(controlNode, events, environment, savedElement);
    } : ref;

    const finalCurrentEventRef: TRef = inputTagNames.has(tagName) ?
        function clearInputValueRef(element: IWasabyHTMLElement): void {
            if (currentEventRef) {
                currentEventRef(element);
            }
            if (!element && !controlNode.markup) {
                clearInputValue(savedElement);
            }
        } :
        currentEventRef;

    return [tagName, props, children, key, finalCurrentEventRef];
}
