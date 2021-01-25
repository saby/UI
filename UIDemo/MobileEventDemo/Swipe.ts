/// <amd-module name="UIDemo/MobileEventDemo/Swipe" />

import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/MobileEventDemo/Swipe');

class Swipe extends Control {
   _template: TemplateFunction = template;

   _swipeCount: number = 0;
   _tapCount: number = 0;

   _beforeMount() {
      this._swipeCount = 0;
      this._tapCount = 0;
   }

   _simpleClick() {
      this._tapCount += 1;
   }

   _swipe() {
      this._swipeCount += 1;
   }
}

Swipe._styles = ['UIDemo/MobileEventDemo/MobileEventDemo'];

export default Swipe;
