/// <amd-module name="UIDemo/RenderFlow/AsyncItem" />

import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import template = require('wml!UIDemo/RenderFlow/AsyncItem');

interface IOptions extends IControlOptions {
    delay: number;
}

export default class AsyncItem extends Control<IOptions> {
    _template: TemplateFunction = template;

    _beforeMount(options: IOptions): Promise<void> {
        if (typeof window === 'undefined') {
            return;
        }
        console.log(`_beforeMount ${options.delay}`);

        return new Promise((r) => {
            setTimeout(() => {
                console.log(`_beforeMount resolve ${options.delay}`);
                r();
            }, options.delay);
        });
    }

    _afterMount(): void {
        console.log(`_afterMount ${this._options.delay}`);
    }
}
