/// <amd-module name="Vdom/_private/Synchronizer/resources/MobileEventHelper" />
/* tslint:disable */

export default class MobileEventHelper {
    private static initEventHandlers = {};

    public static getTouchLocation(event) {
        var data = event.touches ? event.touches[0] : event;
        return {
            x: data.clientX,
            y: data.clientY
        };
    }

    public static hasEventData(eventState) {
        return eventState && eventState.target;
    }

    public static initEventState(event, eventState, initHandler, handlerName) {
        // collect information about event
        this.initEventHandlers[handlerName].push(initHandler);
        eventState.time = Date.now();
        eventState.location = this.getTouchLocation(event);
        eventState.target = event.target;
        return eventState;
    }

    /// Обработка события
    public static stopInitializedHandler() {
        for (let reset in this.initEventHandlers){
            //@ts-ignore
            this.initEventHandlers[reset].resetState();
        }
    }

}
