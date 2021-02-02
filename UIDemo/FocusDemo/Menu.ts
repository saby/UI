import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/FocusDemo/Menu');

export default class FocusDemoMenu extends Control {
    protected _template: TemplateFunction = template;
}
