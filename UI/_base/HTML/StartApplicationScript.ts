/// <amd-module name="UI/_base/HTML/StartApplicationScript" />

import { detection } from 'Env/Env';
import Control from '../Control';

// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/HTML/StartApplicationScript');
import { headDataStore } from 'UI/Deps';

class StartApplicationScript extends Control {
   // tslint:disable-next-line:ban-ts-ignore
   // @ts-ignore
   _template: Function = template;
   private additionalDeps: string[] = [];
   protected isIE: boolean = detection.isIE;
   // идентификатор dom-элемента, от которого строится верстка
   protected rootId: string = 'root';
   // название функции ,которое запускает оживление верстки
   protected StartFunction: string = 'Start';

   // tslint:disable-next-line:no-any
   _beforeMount(): Promise<any> {
      if (typeof window !== 'undefined') {
         return;
      }
      const def = headDataStore.read('waitAppContent')();
      return new Promise<void>((resolve) => {
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
