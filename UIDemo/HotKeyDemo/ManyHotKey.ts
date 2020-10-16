/// <amd-module name="UIDemo/HotKeyDemo/ManyHotKey" />

import { Control, TemplateFunction } from 'UI/Base';
import { Memory } from 'Types/source';
import { getData } from './DataSource';

// @ts-ignore
import template = require('wml!UIDemo/HotKeyDemo/ManyHotKey');

class ManyHotKey extends Control {
   _template: TemplateFunction = template;

   protected _viewSource: Memory;

   protected _beforeMount(): void {
      this._viewSource = new Memory({
         keyProperty: 'id',
         data: getData( 10)
      });
   }

}

ManyHotKey._styles = ['UIDemo/HotKeyDemo/HotKeyDemo'];

export default ManyHotKey;
