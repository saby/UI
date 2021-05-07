import {Control, TemplateFunction} from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/Compatible/ReactComponent';

export default class ReactComponent extends Control {
    protected _template: TemplateFunction = template;
    protected _counter: number = 0;

    changeCounter(): void {
        this._counter++;
    }
}
