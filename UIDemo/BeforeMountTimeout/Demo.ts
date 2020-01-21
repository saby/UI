/// <amd-module name="UIDemo/BeforeMountTimeout/Demo" />

import { Control, TemplateFunction, IControlOptions } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/BeforeMountTimeout/Demo');

class Demo extends Control<IControlOptions> {
   _template: TemplateFunction = template;
}

Demo._styles = ['UIDemo/BeforeMountTimeout/Demo'];

export = Demo;
