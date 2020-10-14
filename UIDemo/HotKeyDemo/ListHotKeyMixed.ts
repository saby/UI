/// <amd-module name="UIDemo/HotKeyDemo/ListHotKeyMixed" />

import { Control, TemplateFunction } from 'UI/Base';
import { Memory } from 'Types/source';
import { getData } from './DataSource';

// @ts-ignore
import template = require('wml!UIDemo/HotKeyDemo/ListHotKeyMixed');

class ListHotKeyMixed extends Control {
   _template: TemplateFunction = template;

   protected _viewSource: Memory;

   protected _beforeMount(): void {
      this._viewSource = new Memory({
         keyProperty: 'id',
         data: getData( 10)
      });
   }

}

ListHotKeyMixed._styles = ['UIDemo/HotKeyDemo/HotKeyDemo'];

export = ListHotKeyMixed;
