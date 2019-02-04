/// <amd-module name="UIDemo/Demo3" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/Demo3');

class Demo3 extends Control {
   public _template: Function = template;

   public data: Array<any> = [{
      id: 1,
      title: 'first'
   }, {
      id: 2,
      title: 'second'
   }];

   public testevent(event, key, value) {
      console.log(key, value);
   }
}

export = Demo3;
