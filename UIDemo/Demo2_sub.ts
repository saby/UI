/// <amd-module name="UIDemo/Demo2_sub" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/Demo2_sub');

class Demo2_sub extends Control {
   public _template: Function = template;

   public prop10: Number = 0;

   public _beforeMount(cfg) {
      console.log('CALL BEFORE MOUNT', cfg.prop);
      this.prop10 = cfg.prop * 10;
   }

   public _beforeUpdate(cfg) {
      console.log('CALL BEFORE UPDATE', cfg.prop);
      this.prop10 = cfg.prop * 10;
   }
}

export = Demo2_sub;
