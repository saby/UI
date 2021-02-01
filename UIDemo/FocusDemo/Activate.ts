import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/FocusDemo/Activate');

export default class FocusActivateDemo extends Control {
    protected _template: TemplateFunction = template;
    lastActivated: string = 'Никакой';
    lastDeactivated: string = 'Никакой';
    protected isActivated(_, newActivated: string): void {
        this.lastActivated = newActivated;
    }
    protected isDeactivated(_, newDeactivated: string): void {
        this.lastDeactivated = newDeactivated;
    }
}
