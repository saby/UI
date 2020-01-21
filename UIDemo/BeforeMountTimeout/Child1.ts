/// <amd-module name="UIDemo/BeforeMountTimeout/Child1" />

import { Control, TemplateFunction, IControlOptions } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/BeforeMountTimeout/Child1');

class Child1 extends Control<IControlOptions> {
   _template: TemplateFunction = template;
   protected _slowMethod: number = 200000;
   protected _maxWaitTime: number = 3000;

   _beforeMount(): void|Promise<void> {
      return new Promise((resolve) => {
         setTimeout(() => {
            resolve();
         }, this._slowMethod);
      });
   }
}

export = Child1;
