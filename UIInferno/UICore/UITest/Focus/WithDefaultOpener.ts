import {TemplateFunction} from 'UICore/Base';
import {TestBaseControl} from '../Base'

// @ts-ignore
import template = require('wml!UICore/UITest/Focus/WithDefaultOpener');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
}

export default TestControl;
