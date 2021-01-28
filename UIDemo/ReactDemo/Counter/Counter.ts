import {Control, IControlOptions, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/Counter/Counter');

interface ICounterOptions extends IControlOptions{
   count: number;
   color: string;
   addHandler: Function;
   removeHandler: Function;
   changeColor: Function;
}

export default class Item extends Control<ICounterOptions> {
   protected _template: TemplateFunction = template;
   protected _needUpdate: boolean = true;
   protected _counter: number = 0;

   protected _shouldUpdate(options: ICounterOptions, context?: object): boolean {
      return this._options.count !== options.count;
   }
}
