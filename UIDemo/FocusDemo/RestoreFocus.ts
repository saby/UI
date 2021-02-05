import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/FocusDemo/RestoreFocus');

export default class FocusRestoreFocusDemo extends Control {
    protected _template: TemplateFunction = template;
    isElementShowen: boolean = true;
    protected toggle(): void {
        this.isElementShowen = !this.isElementShowen;
    }
}
