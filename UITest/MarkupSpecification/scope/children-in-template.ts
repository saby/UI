import {Control, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!UITest/MarkupSpecification/scope/children-in-template');

class TestControl extends Control {
   _template: TemplateFunction = template;
   some: null;
}
export default TestControl;
