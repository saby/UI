/// <amd-module name="UIDemo/MobileEventDemo/Swipe" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/MobileEventDemo/Swipe');

class Swipe extends Control {
   _template = template;

   private _swipeCount: number = null;
   private _tapCount: number = null;

   _beforeMount() {
      this._swipeCount = 0;
      this._tapCount = 0;
   }

   private _simpleClick() {
      this._tapCount += 1;
   }

   private _swipe() {
      this._swipeCount += 1;
   }
}

Swipe._styles = ['UIDemo/MobileEventDemo/MobileEventDemo'];

export = Swipe;
