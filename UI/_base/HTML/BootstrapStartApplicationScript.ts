/// <amd-module name="UI/_base/HTML/BootstrapStartApplicationScript" />

import { detection } from 'Env/Env';
import { default as Control, TemplateFunction } from '../Control';
import template = require('wml!UI/_base/HTML/StartApplicationScript');

class BootstrapStartApplicationScript extends Control {
   _template: TemplateFunction = template;
   private requiredModules: string[] = [];
   protected isIE: boolean = detection.isIE;
   // идентификатор dom-элемента, от которого строится верстка
   protected rootId: string = 'wasaby-content';
   // название функции ,которое запускает оживление верстки
   protected StartFunction: string = 'BootstrapStart';

   _beforeMount(options): Promise<any> {
      if (typeof window !== 'undefined') {
         return;
      }
      this.requiredModules = options.requiredModules || [];
   }

   getDeps(): string {
      if (!this.requiredModules || !this.requiredModules.length) {
         return '[]';
      }
      return '["' + this.requiredModules.join('","') + '"]';
   }
}

export default BootstrapStartApplicationScript;
