/// <amd-module name="UIDemo/MobileEventDemo/LongTap" />

import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/MobileEventDemo/LongTap');

class LongTap extends Control {
   _template: TemplateFunction = template;

   _longTapCount: number = 0;
   _swipeCount: number = 0;
   _tapCount: number = 0;

   _beforeMount() {
      this._longTapCount = 0;
      this._swipeCount = 0;
      this._tapCount = 0;
   }

   _longClick() {
      this._longTapCount += 1;
   }

   _simpleClick() {
      this._tapCount += 1;
   }
   _swipe() {
      this._swipeCount += 1;
   }
}

LongTap._styles = ['UIDemo/MobileEventDemo/MobileEventDemo'];

export default LongTap;
