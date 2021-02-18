/// <amd-module name="UI/_base/HTML/StartReactApplicationScript" />

import { default as Control, TemplateFunction } from '../Control';
import template = require('wml!UI/_base/HTML/StartReactApplicationScript');

class StartReactApplicationScript extends Control {
   _template: TemplateFunction = template;
}

export default StartReactApplicationScript;
