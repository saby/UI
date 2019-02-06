/// <amd-module name="UIDemo/Demo4" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/Demo4');

class Demo4 extends Control {
   public _template: Function = template;
   protected _beforeMount(): void {
      this.theme1 = 'theme1';
      this.theme2 = 'theme1';
   };
   private switchFirst(): void {
      this.theme1 = this.theme1 === 'theme1' ? 'theme2' : 'theme1';
   }
   private switchSecond(): void {
      this.theme2 = this.theme2 === 'theme1' ? 'theme2' : 'theme1';
   }
}

export = Demo4;
