import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/LifecycleDemo/Index');

export default class LifecycleDemo extends Control {
   protected _template: TemplateFunction = template;
}
