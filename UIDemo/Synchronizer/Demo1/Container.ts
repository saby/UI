// @ts-ignore
import {Control, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/Synchronizer/Demo1/Container');

class Container extends Control {
   public _template: TemplateFunction = template;
}

export default Container;
