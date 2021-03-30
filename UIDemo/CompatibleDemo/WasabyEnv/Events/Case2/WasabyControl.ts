import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import template = require('wml!UIDemo/CompatibleDemo/WasabyEnv/Events/Case2/WasabyControl');

class WasabyControl extends Control<IControlOptions> {
   protected _template: TemplateFunction = template;
   value: boolean = false;
   value1: boolean = false;

   static _styles: string[] = ['UIDemo/CompatibleDemo/CompatibleDemo'];
}
export default WasabyControl;
