import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import template = require('wml!UIDemo/CompatibleDemo/WasabyEnv/Events/Demo');

class CompatibleEvent extends Control<IControlOptions> {
   protected _template: TemplateFunction = template;

   static _styles: string[] = ['UIDemo/CompatibleDemo/CompatibleDemo'];
}
export default CompatibleEvent;
