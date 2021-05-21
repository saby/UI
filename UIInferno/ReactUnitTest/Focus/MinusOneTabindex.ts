import { TemplateFunction } from 'UICommon/Base';
import {TestBaseControl} from '../Base';

// @ts-ignore
import template = require('wml!ReactUnitTest/Focus/MinusOneTabindex');

class TestControl extends TestBaseControl {
   _template: TemplateFunction = template;
}

export default TestControl;
