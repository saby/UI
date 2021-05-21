import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!ReactUnitTest/_async/TestControlAsync');

class TestControlAsync extends Control {
    protected _template: TemplateFunction = template;
}

export = TestControlAsync;
