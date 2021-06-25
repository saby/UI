import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/_events/CounterControl';

export default class CounterControl extends Control {
    _template: TemplateFunction = template;
    protected clickCount: number = 0;
    protected touchCount: number = 0;

    _clickHandler(): void {
        this.clickCount += 1;
    }
}
