import {Control, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!ReactUnitTest/MarkupSpecification/scope/children-inner');

class TestControl extends Control {
   _template: TemplateFunction = template;
}
export default TestControl;
