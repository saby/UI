import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_index/InternalOptions');

export default class extends Control {
    protected _template: TemplateFunction = template;

    protected tmplOption: boolean = true;
    protected internalOption: boolean = true;

    protected changeTemplateOptions(): void {
        this.tmplOption = !this.tmplOption;
    }

    protected changeInternalOptions(): void {
        this.internalOption = !this.internalOption;
    }
}
