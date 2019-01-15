/// <amd-module name="UI/_base/HTML/StartApplicationScript" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/StartApplicationScript');

import * as Request from 'View/Request';

class StartApplicationScript extends Control {
   public _template: Function = template;
   private additionalDeps:Array<string> = [];

   public _beforeMount(): Promise<any> {
      if (typeof window !== 'undefined') {
         return;
      }
      let def = Request.getCurrent().getStorage('HeadData').waitAppContent();

      return new Promise((resolve) => {
         def.then((res) => {
            this.additionalDeps = res.additionalDeps;
            resolve();
         });
      })
   }

   public getDeps(): string {
      if (!this.additionalDeps || !this.additionalDeps.length) {
         return '[]';
      }
      let result = '[ ';
      for (let i = 0; i < this.additionalDeps.length; i++) {
         result += (i === 0 ? '' : ', ') + '"' + this.additionalDeps[i] + '"';
      }
      result += ' ]';
      return result;
   }
}

export default StartApplicationScript;
