/// <amd-module name="UIDemo/TemplateDemo/WithReactive" />

import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/TemplateDemo/WithReactive');
// @ts-ignore
import spanTemplate = require('wml!UIDemo/TemplateDemo/_resources/SpanTemplate');

class TemplateDemo extends Control {
   _template: TemplateFunction = template;
   _spanTemplate: TemplateFunction = spanTemplate;
   _spanCount: number = 0;

   _clickHandler(): void {
      this._spanCount = this._spanCount === 0 ? 1000 : 0;;
   }
}

export default TemplateDemo;
