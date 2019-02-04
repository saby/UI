/// <amd-module name="UIDemo/Demo4_sub" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/Demo4_sub');

import "css!theme?UIDemo/Demo4_sub";

class Demo4_sub extends Control {
   public _template: Function = template;

   public _theme: Array<string> = ['UIDemo/Demo4_sub'];
}

export = Demo4_sub;
