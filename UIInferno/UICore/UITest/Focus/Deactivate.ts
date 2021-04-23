import {TemplateFunction} from 'UICore/Base';
import {TestBaseControl} from '../Base'

// @ts-ignore
import template = require('wml!UICore/UITest/Focus/Deactivate');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
    lastDeactivatedName: string = 'noone';
    protected _markDeactivate = (e, name) => {
        this.lastDeactivatedName = name;
    }
}

export default TestControl;
