/// <amd-module name="UIDemo/RenderFlow/AsyncDelay" />

import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import template = require('wml!UIDemo/RenderFlow/AsyncDelay');

interface IOptions extends IControlOptions {
}

export default class AsyncDemo extends Control<IOptions> {
    _template: TemplateFunction = template;

    _beforeMount(): void {
        console.log('_beforeMount AsyncDelay');
    }

    _afterMount(): void {
        console.log('_afterMount AsyncDelay');
    }
}
