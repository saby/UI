/// <amd-module name="UI/_base/HTML/StartApplicationScript" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/StartApplicationScript');

import * as AppEnv from 'Application/Env';

class StartApplicationScript extends Control {
   _template: Function = template;
   private additionalDeps: string[] = [];

   _beforeMountLimited(): Promise<any> {
      // This component awaits completion of building content of _Wait component
      // So we don't need timeout of async building in this component
      // Because we need to build depends list in any case
      // before returning html to client
      return this._beforeMount.apply(this, arguments);
   }

   _beforeMount(): Promise<any> {
      if (typeof window !== 'undefined') {
         return;
      }
      const def = AppEnv.getStore('HeadData').waitAppContent();

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
