/// <amd-module name="UIDemo/HotKeyDemo/ScrollHotKey" />

import { Control, TemplateFunction } from 'UI/Base';
import { Memory } from 'Types/source';
import { getData } from './DataSource';

// @ts-ignore
import template = require('wml!UIDemo/HotKeyDemo/ScrollHotKey');

class ScrollHotKey extends Control {
   _template: TemplateFunction = template;

   protected _viewSource: Memory;

   protected _beforeMount(): void {
      this._viewSource = new Memory({
         keyProperty: 'id',
         data: getData(50)
      });
   }

}

ScrollHotKey._styles = ['UIDemo/HotKeyDemo/HotKeyDemo'];

export = ScrollHotKey;
