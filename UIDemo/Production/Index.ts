/// <amd-module name="UIDemo/Production/Index" />

import {Control, TemplateFunction} from 'UI/Base';
import * as template from 'wml!UIDemo/Production/Index';
import { constants } from 'Env/Env';

export default class Index extends Control {
   _template: TemplateFunction = template;

   protected _beforeMount(): Promise<any> | void {
      constants.isProduction = true;
   }
}
