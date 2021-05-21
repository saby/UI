import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!ReactUnitTest/_async/TestControlSync');

class TestControlSync extends Control {
    protected _template: TemplateFunction = template;
}

export = TestControlSync;
