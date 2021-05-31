/// <amd-module name="UIDemo/Index" />

import { Body } from "Application/Page";
import { Control, TemplateFunction } from 'UI/Base';
import  { constants } from 'Env/Env';
import template = require('wml!UIDemo/Index');

// @TODO костыль - пока не разбирался, почему не тянутся стили из _styles
import 'css!UIDemo/Index';

class Index extends Control {
   _template: TemplateFunction = template;
   protected isServerSide: boolean = constants.isServerSide;
   static _styles: string[] = ['UIDemo/Index'];

   protected _beforeMount(options: {theme: string}): void {
      Body.getInstance().addClass(`controls_theme-${options.theme}`);
   }
}

export default Index;
