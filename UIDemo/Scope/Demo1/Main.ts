// @ts-ignore
import {Control, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/Scope/Demo1/Main');

class Main extends Control {
   public _template: TemplateFunction = template;
   public _getResults() {
      return this._calcSomething() + ' руб';
   }
   public _calcSomething() {
      return 1+1;
   }
}

export default Main;
