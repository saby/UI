import {Control, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!UITest/MarkupSpecification/resolver/TestControl');

class TestControl extends Control {
    _template: TemplateFunction = template;
}
export default TestControl;
