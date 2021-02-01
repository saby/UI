import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/FocusDemo/RestoreFocus/RestoreFocusHere');

export default class FocusRestoreFocusHereDemo extends Control {
    protected _template: TemplateFunction = template;
}
