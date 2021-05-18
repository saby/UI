import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/FocusDemo/Index');

export default class FocusDemo extends Control {
    protected _template: TemplateFunction = template;

    static _styles: string[] = ['UIDemo/FocusDemo/Index'];
}
