import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/ReactEventDemo/Wasaby/Notifier');

class Notifier extends Control {
    _template = template;

    protected _notifyHandler(): void {
        this._notify('userEvent', []);
    }

    protected _notifyHandlerWithBubbling(): void {
        this._notify('userEventBubbling', [], {bubbling: true});
    }
}

export default Notifier;
