import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_index/LoadFail');

export default class extends Control {
    protected _template: TemplateFunction = template;
}
