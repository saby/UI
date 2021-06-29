import {
    Control,
    IControlOptions,
    TemplateFunction
} from 'UI/Base';

import * as template from 'wml!UIDemo/PortalDemo/ToBePortal';

interface IPortalOptions extends IControlOptions {
    opener: Control;
}

export default class ToBePortal extends Control<IPortalOptions> {
    _template: TemplateFunction = template;
    counter: number = 0;
    protected updateOunterCounter(_: unknown, newCounter: number): void {
        this.counter = newCounter;
    }
}
