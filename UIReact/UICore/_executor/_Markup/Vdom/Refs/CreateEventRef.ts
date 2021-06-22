import { IWasabyEvent } from 'UICommon/Events';
import { WasabyEvents } from 'UICore/Events';
import { Responsibility, IResponsibilityHandler } from 'UICore/Ref';

export class CreateEventRef extends Responsibility {
    private tagName: string;
    private eventsObject: {
        events: Record<string, IWasabyEvent[]>;
    };
    constructor(tagName: string, eventsObject: {events: Record<string, IWasabyEvent[]>;}) {
        super();
        this.tagName = tagName;
        this.eventsObject = eventsObject;

    }
    getHandler(): IResponsibilityHandler {
        return (node: HTMLElement): void => {
            if (node && Object.keys(this.eventsObject.events).length > 0) {
                WasabyEvents.getInstance().setEventHook(this.tagName, this.eventsObject, node);
            }
        };
    }
}
