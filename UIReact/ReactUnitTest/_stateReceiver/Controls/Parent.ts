/// <amd-module name="ReactUnitTest/_stateReceiver/Controls/Parent" />

import {Control, TemplateFunction, IControlOptions} from 'UI/Base';
// @ts-ignore
import * as template from 'wml!ReactUnitTest/_stateReceiver/Controls/Parent';

interface ITestChildren extends Control {
   getReceivedStateKey(): string;
}

export default class Parent extends Control<IControlOptions> {
   _template: TemplateFunction = template;
   _options: IControlOptions;
   _children: {
      children: ITestChildren
   };

   getChildrenKey(): string {
      return this._children?.children.getReceivedStateKey();
   }
}
