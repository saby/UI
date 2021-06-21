import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/_keys/Item';

export default class Item extends Control {
    _template: TemplateFunction = template;
    updated: number = 0;

    protected _afterUpdate(oldOptions?: {}, oldContext?: any): void {
        this.updated++;
        super._afterUpdate(oldOptions, oldContext);
    }
}
