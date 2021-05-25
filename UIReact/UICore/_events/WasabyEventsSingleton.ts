import WasabyEventsReact from './WasabyEvents';
import { WasabyEventsDebug } from './WasabyEventsDebug';
import { cookie } from 'Env/Env';

/**
 * @author Тэн В.А.
 */
export class WasabyEventsSingleton {
    private static eventSystem: WasabyEventsReact;

    public static initEventSystem(domElement: HTMLElement, tabKeyHandler: Function): WasabyEventsReact {
        if (!WasabyEventsSingleton.eventSystem) {
            WasabyEventsDebug.debugEnable = WasabyEventsDebug.debugEnable || cookie.get('eventSystemDebug');
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
