/// <amd-module name="UI/_base/HTML/JsLinks" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/JsLinks');
import * as AppEnv from 'Application/Env';

class JsLinks extends Control {
   _template: Function = template;

   js: string[] = [];
   tmpl: string[] = [];
   wml: string[] = [];
   themedCss: string[] = [];
   simpleCss: string[] = [];
   receivedStateArr: string = '';

   _beforeMountLimited(): Promise<any> {
      // https://online.sbis.ru/opendoc.html?guid=252155de-dc95-402c-967d-7565951d2061
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
      const headData = AppEnv.getStore('HeadData');
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
