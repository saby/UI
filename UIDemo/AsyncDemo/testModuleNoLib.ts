import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/testModuleNoLib');

class TestModule extends Control {
    protected _template: TemplateFunction = template;
}

export = TestModule;
