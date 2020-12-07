import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_testLibAsync/testModule');

export default class TestModule extends Control {
    protected _template: TemplateFunction = template;
}
