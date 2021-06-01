/// <amd-module name="ReactUnitTest/_stateReceiver/Controls/Children" />

import {Control, TemplateFunction, IControlOptions} from 'UI/Base';
// @ts-ignore
import * as template from 'wml!ReactUnitTest/_stateReceiver/Controls/Children';

export default class Children extends Control {
   _template: TemplateFunction = template;
   _options: IControlOptions;

   getReceivedStateKey(): string {
      return this._options?.rskey;
   }
}
