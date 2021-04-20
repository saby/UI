/// <amd-module name="UIDemo/Index" />

import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/Index');

class Index extends Control {
   _template: TemplateFunction = template;
   static _styles: string[] = ['UIDemo/Index'];
   pageConfig = {title: 'demo'}
}

export default Index;
