import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemoNewVer/Index');

class Index extends Control {
   public _template: Function = template;

   public clickHere() {
      alert("Hello");
   }
}

export = Index;
