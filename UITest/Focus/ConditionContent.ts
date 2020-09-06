import {TemplateFunction} from 'UI/Base';
import {TestBaseControl} from '../Base'

// @ts-ignore
import template = require('wml!UITest/Focus/ConditionContent');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
    noNeedContent: boolean = false;
}

export default TestControl;
