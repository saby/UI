/// <amd-module name="UIDemo/RenderFlow/AsyncItemChildren" />

import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import template = require('wml!UIDemo/RenderFlow/AsyncItemChildren');

interface IOptions extends IControlOptions {
    delay: number;
}

export default class AsyncItemChildren extends Control<IOptions> {
    _template: TemplateFunction = template;

    _beforeMount(options: IOptions): void {
        console.log(`_beforeMount Children ${options.delay}`);
    }

    _afterMount(): void {
        console.log(`_afterMount Children ${this._options.delay}`);
    }
}
