/// <amd-module name="UI/_base/HTML/StartApplicationScript" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/StartApplicationScript');

import * as AppEnv from 'Application/Env';
import HeadData from 'UI/_base/HeadData';

class StartApplicationScript extends Control {
   // @ts-ignore
   _template: Function = template;
   private additionalDeps: string[] = [];

   _beforeMount(): Promise<any> {
      if (typeof window !== 'undefined') {
         return;
      }
      const headData = AppEnv.getStore<HeadData>('headData');
      const def = headData.get('waitAppContent')();

      return new Promise((resolve) => {
         def.then((res) => {
            this.additionalDeps = res.additionalDeps;
            resolve();
         });
      });
   }

   getDeps(): string {
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
