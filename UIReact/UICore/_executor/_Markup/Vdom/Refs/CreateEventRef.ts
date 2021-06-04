import { IWasabyEvent } from 'UICommon/Events';
import { setEventHook } from 'UICore/Events';
import { Responsibility, IResponsibilityHandler, } from 'UICore/Ref';

export class CreateEventRef extends Responsibility {
    private tagName: string;
    private eventsObject: {
        events: Record<string, IWasabyEvent[]>;
    };
    constructor(tagName, eventsObject) {
        super();
        this.tagName = tagName;
        this.eventsObject = eventsObject;

    }
    public getHandler(): IResponsibilityHandler {
        return (node: HTMLElement): void => {
            if (node && Object.keys(this.eventsObject.events).length > 0) {
                setEventHook(this.tagName, this.eventsObject, node);
            }
        };
    }
}
