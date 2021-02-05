import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/InheritedOptions/ControlOneLevelDeep';

export default class ControlOneLevelDeep extends Control {
   protected _template: TemplateFunction = template;
}
