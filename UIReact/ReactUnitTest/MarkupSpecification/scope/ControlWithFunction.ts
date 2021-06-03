import {Control, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!ReactUnitTest/MarkupSpecification/scope/ControlWithFunction');

class TestControl extends Control {
    _template: TemplateFunction = template;
    _someMethod(): string {
        return 'some text';
    }
}
export default TestControl;
