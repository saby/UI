/// <amd-module name="UIDemo/Index" />

import { Control } from 'UI/Base';
// @ts-ignore
import template = require('wml!UIDemo/Index');
export default class Index extends Control {
   _template = template;
   static _styles = ['UIDemo/Index'];
}
