import {
    Control,
    TemplateFunction
} from 'UI/Base';

import * as template from 'wml!UIDemo/PortalDemo/LiveContent';

export default class LiveContent extends Control {
    _template: TemplateFunction = template;
    counter: number = 0;
    clickHandler(): void {
        this.counter++;
        this._notify('counterChanged', [this.counter]);
    }
}
