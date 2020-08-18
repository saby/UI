import {TemplateFunction} from 'UI/Base';
import {TestBaseControl} from '../Base';
import template = require('wml!UITest/Focus/ContentEditableDiv');

class TestControl extends TestBaseControl {
   _template: TemplateFunction = template;
}

export default TestControl;
