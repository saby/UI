/// <amd-module name="ReactUnitTest/_stateReceiver/Controls/UselessChildren" />

import {Control, TemplateFunction} from 'UI/Base';
// @ts-ignore
import * as template from 'wml!ReactUnitTest/_stateReceiver/Controls/Children';

export default class Children extends Control {
   _template: TemplateFunction = template;
}
