/// <amd-module name="UIDemo/Demo1" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/Demo1');

class Demo1 extends Control {
   public _template: Function = template;
   public tempValue: number = 0;
   public value: number = 0;
   
   public clickHere() {
      alert("Hello");
   }
}

export = Demo1;
