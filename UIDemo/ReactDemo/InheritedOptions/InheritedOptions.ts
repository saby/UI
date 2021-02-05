import {Control, TemplateFunction} from 'UI/Base';

// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/InheritedOptions/InheritedOptions';

export default class InheritedOptions extends Control {
   protected _template: TemplateFunction = template;
}
