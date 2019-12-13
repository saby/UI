import {TemplateFunction} from 'UI/Base';
import {TestBaseControl} from '../Base'

import template = require('wml!UITest/Focus/Deactivate');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
    lastDeactivatedName: string = 'noone';
    protected _markDeactivate = (e, name) => {
        this.lastDeactivatedName = name;
    }
}

export default TestControl;
