/// <amd-module name="UIDemo/HotKeyDemo/List" />

import { Control, TemplateFunction } from 'UI/Base';
import { Memory } from 'Types/source';
import { getData } from './DataSource';

// @ts-ignore
import template = require('wml!UIDemo/HotKeyDemo/List');

class ListWithoutHotKey extends Control {
   _template: TemplateFunction = template;

   protected _viewSource: Memory;

   protected _beforeMount(): void {
      this._viewSource = new Memory({
         keyProperty: 'id',
         data: getData(10)
      });
   }

}

ListWithoutHotKey._styles = ['UIDemo/HotKeyDemo/HotKeyDemo'];

export default ListWithoutHotKey;
