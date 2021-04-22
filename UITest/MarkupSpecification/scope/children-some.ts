import {Control, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!UITest/MarkupSpecification/scope/children-some');

class TestControl extends Control {
   _template: TemplateFunction = template;
   someTpl: null;
}
export default TestControl;
