import {Control, TemplateFunction} from 'UI/Base';

import template = require('wml!UITest/Focus/Proxy');

class TestControl extends Control {
    _template: TemplateFunction = template;
}

export default TestControl;
