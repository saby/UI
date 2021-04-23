/**
 * @author Тэн В.А.
 */

export interface ITouchEvent extends TouchEvent {
    touches: TouchList;
    clientX: number;
    clientY: number;
    addedToClickState?: boolean
}

export interface IEventState extends Event {
    time: number;
    location: ITouchLocation | null;
    target: EventTarget;
}

export interface ITouchLocation {
    x: number;
    y: number;
}
export interface ILongTapEvent extends Event {
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    screenX: number;
    screenY: number;
}

export class WasabyTouchEvent {
    private static initEventHandlers = {};

    public static getTouchLocation(event: ITouchEvent): ITouchLocation {
        const data = event.touches ? event.touches[0] : event;
        return {
            x: data.clientX,
            y: data.clientY
        };
    }

    public static hasEventData(eventState: IEventState): EventTarget {
        return eventState && eventState.target;
    }

    public static initEventState(event: ITouchEvent,
                                 eventState: IEventState,
                                 initHandler: Function,
                                 handlerName: string): IEventState {
        if (handlerName && initHandler) {
            // collect information about event
            this.initEventHandlers[handlerName] = initHandler;
        }
        eventState.time = Date.now();
        eventState.location = this.getTouchLocation(event);
        eventState.target = event.target;
        return eventState;
    }

    /// Обработка события
    public static stopInitializedHandler(): void {
        for (let reset in this.initEventHandlers) {
            //@ts-ignore
            this.initEventHandlers[reset].resetState();
        }
    }

}
