/// <amd-module name="UI/_base/HTML/JsLinks" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/JsLinks');
import { headDataStore } from 'UI/_base/HeadData';

class JsLinks extends Control {
   // @ts-ignore
   _template: Function = template;

   js: string[] = [];
   tmpl: string[] = [];
   wml: string[] = [];
   themedCss: string[] = [];
   simpleCss: string[] = [];
   rsSerialized: string = '';

   _beforeMount() {
      if (typeof window !== 'undefined') {
         return;
      }
      return headDataStore.read('waitAppContent')().then((res) => {
         this.js = res.js;
         this.tmpl = res.tmpl;
         this.wml = res.wml;
         this.rsSerialized = res.rsSerialized;
      });
   }
}

export default JsLinks;
