/// <amd-module name="UIDemo/TemplateDemo/Template" />

import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/TemplateDemo/Template');

import { IObject } from './ITemplate';

class TemplateDemo extends Control {
   _template: TemplateFunction = template;
   _spanCount: number = 0;
   _objectGroups: IObject = {value: true};
   _arrayGroups: boolean[] = [true, true, true];

   _clickHandler(): void {
      this._spanCount = this._spanCount === 1000 ? 0 : 1000;
   }

   _clickHandler2(): void {
      this._objectGroups.value = !this._objectGroups.value;
      // delete this
      this._forceUpdate();
   }

   _clickHandler3(): void {
      if (this._arrayGroups.length === 3) {
         this._arrayGroups.shift();
      } else {
         this._arrayGroups.push(true);
      }
   }
}

export default TemplateDemo;
