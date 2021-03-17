import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/ContentOptions/Component';

export default class LifecycleController extends Control {
    protected _template: TemplateFunction = template;

    constructor(...args: [object]) {
        super(...args);
    }

    protected _afterUpdate(oldOptions?: any, oldContext?: object): void {
        super._afterUpdate(oldOptions, oldContext);
        // @ts-ignore
        console.log('Component: _afterUpdate() was called');
    }
}