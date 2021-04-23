import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/FocusDemo/Activate/ActivateElement');

export default class FocusActivateElementDemo extends Control {
    protected _template: TemplateFunction = template;
}
