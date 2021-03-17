/// <amd-module name="UIDemo/TemplateDemo/Template" />

import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/TemplateDemo/Template');

class TemplateDemo extends Control {
   _template: TemplateFunction = template;
   _spanCount: number = 0;

   _clickHandler(): void {
      this._spanCount = this._spanCount === 0 ? 1000 : 0;
   }
}

export default TemplateDemo;
