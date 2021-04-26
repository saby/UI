import {Control} from 'UICore/Base';
import { TemplateFunction } from 'UICommon/Base';

// @ts-ignore
import template = require('wml!UICore/UITest/Focus/Proxy');

class TestControl extends Control {
    _template: TemplateFunction = template;
}

export default TestControl;
