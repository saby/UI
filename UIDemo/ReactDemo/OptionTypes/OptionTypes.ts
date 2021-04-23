import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/OptionTypes/OptionTypes';

const totallyNotAMagicNumber = 456;
const anotherNotMagicNumber = 789;

export default class OptionTypes extends Control {
   protected _template: TemplateFunction = template;
   protected _firstValue: string | number = '123';
   protected _secondValue: string | number = totallyNotAMagicNumber;

   constructor(...args: [object]) {
      super(...args);
      this._swapValue = this._swapValue.bind(this);
   }

   protected _swapValue(): void {
      this._firstValue = this._firstValue === '123' ? anotherNotMagicNumber : '123';
      this._secondValue = this._secondValue === '123' ? totallyNotAMagicNumber : '123';
      this._forceUpdate();
   }
}
