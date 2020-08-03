/// <amd-module name="UI/_base/HTML/Wait" />

import Control, { TemplateFunction } from 'UI/_base/Control';
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/HTML/Wait');
import { headDataStore } from 'UI/_base/HeadData';

const asyncTemplate: TemplateFunction = function() {
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
// tslint:disable-next-line:no-string-literal
asyncTemplate['stable'] = template['stable'];

class Wait extends Control {
   _template: TemplateFunction = asyncTemplate;

   waitDef: Promise<void>;

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
      headDataStore.read('collectDeps')(this.waitDef);
      if (typeof window !== 'undefined') {
         this.resolvePromiseFn();
         this.createPromise();
      }
   }

}

export default Wait;
