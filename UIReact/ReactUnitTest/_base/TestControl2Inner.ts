import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import * as template from 'wml!ReactUnitTest/_base/TestControl2Inner';

const TIMEOUT = 100;

export default class TestControl extends Control {
    _template: TemplateFunction = template;
    protected _beforeMount(
        options?: IControlOptions
    ): Promise<void> | void {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, TIMEOUT);
        });
    }
    protected _afterMount(options?: {}, contexts?: any): void {
        super._afterMount(options, contexts);
    }
}
