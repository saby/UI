import {Control} from 'UI/ReactComponent';

// @ts-ignore
import template = require('wml!UIDemo/ReactEventDemo/Compatible/Notifier');


class Notifier extends Control {
    constructor(props) {
        super(props);
        this._notifyHandler = this._notifyHandler.bind(this);
        this._notifyHandlerWithBubbling = this._notifyHandlerWithBubbling.bind(this);
    }

    protected _notifyHandler(): void {
        this._notify('userEvent', []);
    }

    protected _notifyHandlerWithBubbling(): void {
        this._notify('userEventBubbling', [], {bubbling: true});
    }
}

// @ts-ignore
Notifier.prototype._template = template;

export default Notifier;
