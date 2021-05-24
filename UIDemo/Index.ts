/// <amd-module name="UIDemo/Index" />

import { Control, TemplateFunction } from 'UI/Base';
import  { constants } from 'Env/Env';
import template = require('wml!UIDemo/Index');

// @TODO костыль - пока не разбирался, почему не тянутся стили из _styles
import 'css!UIDemo/Index';

class Index extends Control {
   _template: TemplateFunction = template;
   protected isServerSide: boolean = constants.isServerSide;
   static _styles: string[] = ['UIDemo/Index'];
}

export default Index;
