import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemoNewVer/Demo2');

class Demo2 extends Control {
   public _template: Function = template;

   public value: Number = 5;

   public plus(ev, val) {
      this.value += val;
   }
}

export = Demo2;
