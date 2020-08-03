/// <amd-module name="UI/_base/HTML/StartApplicationScript" />

import Control, { TemplateFunction } from 'UI/_base/Control';
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/HTML/StartApplicationScript');

class StartApplicationScript extends Control {
   _template: TemplateFunction = template;
}

export default StartApplicationScript;
