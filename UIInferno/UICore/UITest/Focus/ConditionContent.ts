import {TemplateFunction} from 'UICore/Base';
import {TestBaseControl} from '../Base';

// @ts-ignore
import template = require('wml!UICore/UITest/Focus/ConditionContent');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
    noNeedContent: boolean = false;
}

export default TestControl;
