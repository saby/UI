/// <amd-module name="UI/_base/HTML/JsLinks" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/JsLinks');
import * as AppEnv from 'Application/Env';

class JsLinks extends Control {
   // @ts-ignore
   _template: Function = template;

   js: string[] = [];
   tmpl: string[] = [];
   wml: string[] = [];
   themedCss: string[] = [];
   simpleCss: string[] = [];
   receivedStateArr: string = '';

   _beforeMount(): Promise<any> {
      if (typeof window !== 'undefined') {
         return;
      }
      const headData = AppEnv.getStore('HeadData');
      // @ts-ignore
      const def = headData.waitAppContent();
      return new Promise((resolve, reject) => {
         def.then((res) => {
            this.js = res.js;
            this.tmpl = res.tmpl;
            this.wml = res.wml;
            this.themedCss = res.css.themedCss;
            this.simpleCss = res.css.simpleCss;
            this.receivedStateArr = res.receivedStateArr;
            resolve(true);
         });
      });
   }

   getCssNameForDefineWithTheme(cssLink: string): string {
      return 'theme?' + cssLink;
   }

   getDefines(): string {
      let result = '';
      if (this.themedCss && this.simpleCss) {
         let i;
         for (i = 0; i < this.simpleCss.length; i++) {
            result += 'define("css!' + this.simpleCss[i] + '", "");';
         }
         for (i = 0; i < this.themedCss.length; i++) {
            result += 'define("css!' + this.getCssNameForDefineWithTheme(this.themedCss[i]) + '", "");';
         }
      }

      return result;
   }

}

export default JsLinks;
