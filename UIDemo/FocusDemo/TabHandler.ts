import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/FocusDemo/TabHandler');

export default class FocusTabHandlerDemo extends Control {
    protected _template: TemplateFunction = template;
}
