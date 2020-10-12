/// <amd-module name="UIDemo/TemplateDemo/Template" />

import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/TemplateDemo/Template');

class TemplateDemo extends Control {
   _template: TemplateFunction = template;
}

export = TemplateDemo;
