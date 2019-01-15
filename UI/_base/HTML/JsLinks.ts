/// <amd-module name="UI/_base/HTML/JsLinks" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/JsLinks');
import * as Request from 'View/Request';


class JsLinks extends Control {
   public _template: Function = template;

   public js: Array<string> = [];
   public tmpl: Array<string> = [];
   public wml: Array<string> = [];
   public receivedStateArr: string = '';

   public _beforeMountLimited():Promise<any> {
      // https://online.sbis.ru/opendoc.html?guid=252155de-dc95-402c-967d-7565951d2061
      // This component awaits completion of building content of _Wait component
      // So we don't need timeout of async building in this component
      // Because we need to build depends list in any case
      // before returning html to client
      return this._beforeMount.apply(this, arguments);
   }


   public _beforeMount():Promise<any> {
      if (typeof window !== 'undefined') {
         return;
      }
      let headData = Request.getCurrent().getStorage('HeadData');
      let def = headData.waitAppContent();
      return new Promise((resolve, reject) => {
         def.then((res) => {
            this.js = res.js;
            this.tmpl = res.tmpl;
            this.wml = res.wml;
            this.receivedStateArr = res.receivedStateArr;
            resolve(true);
         });
      });
   }

}

export default JsLinks;
