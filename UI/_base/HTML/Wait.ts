/// <amd-module name="UI/_base/HTML/Wait" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/Wait');
import * as AppEnv from 'Application/Env';

const asyncTemplate = function(): any {
   const res = template.apply(this, arguments);
   if (res.then) {
      res.then((result) => {
         this.resolvePromiseFn();
         return result;
      });
   } else {
      this.resolvePromiseFn();
   }
   return res;
};

// Template functions should have true "stable" flag to send error on using, for example, some control instead it.
asyncTemplate.stable = template.stable;

class Wait extends Control {
   _template: Function = asyncTemplate;

   waitDef: Promise<any>;

   private resolvePromise: Function = null;
   private resolvePromiseFn(): void {
      if (this.resolvePromise) {
         this.resolvePromise();
         this.resolvePromise = null;
      }
   }
   private createPromise(): void {
      this.waitDef = new Promise((resolve) => {
         this.resolvePromise = resolve;
      });
   }

   _beforeMount(): void {
      this.createPromise();
      AppEnv.getStore('HeadData').pushWaiterDeferred(this.waitDef);
      if (typeof window !== 'undefined') {
         this.resolvePromiseFn();
         this.createPromise();
      }
   }

}

export default Wait;
