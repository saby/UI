import {TemplateFunction} from 'UICore/Base';
import {TestBaseControl} from '../Base'

// @ts-ignore
import template = require('wml!UICore/UITest/Focus/AutofocusInside');

class TestControl extends TestBaseControl {
   _template: TemplateFunction = template;
}

export default TestControl;
