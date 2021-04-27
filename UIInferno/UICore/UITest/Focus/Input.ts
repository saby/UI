import { TemplateFunction } from 'UICommon/Base';
import {TestBaseControl} from '../Base';

// @ts-ignore
import template = require('wml!UICore/UITest/Focus/Input');

class TestControl extends TestBaseControl {
   _template: TemplateFunction = template;
}

export default TestControl;
