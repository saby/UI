// @ts-ignore
import {Control, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/Synchronizer/Demo1/Main');

class Main extends Control {
   public _template: TemplateFunction = template;
   public _value = 0;
   public _click() {
      this._value++;
   };
}

export default Main;
