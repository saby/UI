import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import template = require('wml!UIDemo/CompatibleDemo/WasabyEnv/Events/Case2/Index');

class WasabyIndex extends Control<IControlOptions> {
   protected _template: TemplateFunction = template;
   value: boolean = false;
   value1: boolean = false;

   static _styles: string[] = ['UIDemo/CompatibleDemo/WasabyEnv/Events/EventDemo'];
}
export default WasabyIndex;
