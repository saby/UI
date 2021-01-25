import {Control} from 'UI/ReactComponent';

// @ts-ignore
import template = require('wml!UIDemo/ReactEventDemo/Compatible/Subscriber');


class Subscriber extends Control {
    protected userEventWasCalled: number = 0;
    protected userEventWithBubblingWasCalled: number = 0;
    protected addNewHandler;

    constructor(props) {
        super(props);
        this.addNewHandler = props.addNewHandler;
    }

    protected _beforeMount(): void {
        this._userEventCallback = this._userEventCallback.bind(this);
        this._userEventCallbackWithBubbling = this._userEventCallbackWithBubbling.bind(this);
    }
    
    protected _userEventCallback(): void {
        this.userEventWasCalled += 1;
    }

    protected _userEventCallbackWithBubbling(): void {
        this.userEventWithBubblingWasCalled += 1;
    }

}

// @ts-ignore
Subscriber.prototype._template = template;

export default Subscriber;
