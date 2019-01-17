/// <amd-module name="UIDemo/Index" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/Index');

class Index extends Control {
   public _template: Function = template;

   public clickHere() {
      alert("Hello");
   }
}

export = Index;
