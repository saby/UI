/// <amd-module name="UIDemo/MobileEventDemo/LongTap" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/MobileEventDemo/LongTap');

class LongTap extends Control {
   _template = template;

   private _longTapCount: number = 0;
   private _swipeCount: number = 0;
   private _tapCount: number = 0;

   _beforeMount() {
      this._longTapCount = 0;
      this._swipeCount = 0;
      this._tapCount = 0;
   }

   private _longClick() {
      this._longTapCount += 1;
   }

   private _simpleClick() {
      this._tapCount += 1;
   }
   private _swipe() {
      this._swipeCount += 1;
   }
}

LongTap._styles = ['UIDemo/MobileEventDemo/MobileEventDemo'];

export = LongTap;
