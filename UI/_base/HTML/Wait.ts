/// <amd-module name="UI/_base/HTML/Wait" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/Wait');
import * as Request from 'View/Request';

let asyncTemplate = function() {
   let res = template.apply(this, arguments);
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
   public _template: Function = asyncTemplate;

   public waitDef: Promise<any>;

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

   public _beforeMount(): void {
      this.createPromise();
      Request.getCurrent().getStorage('HeadData').pushWaiterDeferred(this.waitDef);
      if (typeof window !== 'undefined') {
         this.resolvePromiseFn();
         this.createPromise();
      }
   }

}

export default Wait;
