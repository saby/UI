import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_testLib/testModule');

export default class TestModule extends Control {
    protected _template: TemplateFunction = template;
}
