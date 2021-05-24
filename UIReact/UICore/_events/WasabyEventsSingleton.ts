import WasabyEventsReact from './WasabyEvents';

export class WasabyEventsSingleton {
    private static eventSystem: WasabyEventsReact;

    public static initEventSystem(domElement: HTMLElement, tabKeyHandler: Function): WasabyEventsReact {
        if (!WasabyEventsSingleton.eventSystem) {
            WasabyEventsSingleton.eventSystem = new WasabyEventsReact(domElement, tabKeyHandler);
        }
        return WasabyEventsSingleton.eventSystem;
    }

    public static getEventSystem(): WasabyEventsReact {
        if (!WasabyEventsSingleton.eventSystem) {
            throw new Error('Event system not initialize');
        }
        return WasabyEventsSingleton.eventSystem;
    }
}
