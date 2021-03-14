import { Control, TemplateFunction } from 'UI/Base';
import { descriptor } from 'Types/entity';

// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/OptionTypes/Tester';

export default class Tester extends Control {
   protected _template: TemplateFunction = template;

   static getOptionTypes(): object {
      return {
         testOption: descriptor(String).required()
      };
   }
}
