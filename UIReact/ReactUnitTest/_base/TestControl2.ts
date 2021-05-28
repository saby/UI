import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/_base/TestControl2';

export default class TestControl extends Control {
    _template: TemplateFunction = template;

    protected _afterMount(options?: {}, contexts?: any): void {
        super._afterMount(options, contexts);
    }
}
