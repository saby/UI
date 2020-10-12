/// <amd-module name="UIDemo/TemplateDemo/WithReactive" />

import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/TemplateDemo/WithReactive');

class TemplateDemo extends Control {
   _template: TemplateFunction = template;
   _spanTemplate: string = "wml!UIDemo/TemplateDemo/_resources/SpanTemplate";
}

export = TemplateDemo;
