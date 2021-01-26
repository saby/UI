import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/ReactEventDemo/Wasaby/Subscriber');

class Subscriber extends Control {
    _template = template;
    protected userEventWasCalled: number = 0;
    protected userEventWithBubblingWasCalled: number = 0;

    protected _userEventCallback(): void {
        this.userEventWasCalled += 1;
    }

    protected _userEventCallbackWithBubbling(): void {
        this.userEventWithBubblingWasCalled += 1;
    }
}

export default Subscriber;
