import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/InheritedOptions/ControlTwoLevelsDeep';

export default class ControlTwoLevelsDeep extends Control {
   protected _template: TemplateFunction = template;
}
