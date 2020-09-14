import {TemplateFunction} from 'UI/Base';
import {TestBaseControl} from '../Base'

// @ts-ignore
import template = require('wml!UITest/Focus/DelegatedTabfocus');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
}

export default TestControl;
