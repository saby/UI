/// <amd-module name="UIDemo/Demo4" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/Demo4');

class Demo4 extends Control {
   public _template: Function = template;
}

export = Demo4;
