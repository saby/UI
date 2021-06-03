import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/_events/OuterControl';

export default class TestControl extends Control {
    _template: TemplateFunction = template;
    _clickHandler(): void {
        // nothing
    }
}
