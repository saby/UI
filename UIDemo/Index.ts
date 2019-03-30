/// <amd-module name="UIDemo/Index" />

import {Control} from 'UI/Base';


import * from 'UIDemo/Demo1';
import * from 'UIDemoNewVer/Demo1';

// @ts-ignore
import template = require('wml!UIDemo/Index');

class Index extends Control {
   public _template: Function = template;

   public clickHere() {
      alert("Hello");
   }
}

export = Index;
