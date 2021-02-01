import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/FocusDemo/RestoreFocus');

export default class FocusRestoreFocusDemo extends Control {
    protected _template: TemplateFunction = template;
}
