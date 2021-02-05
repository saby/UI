import {Control, TemplateFunction} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/Counter/Controller');

export default class Item extends Control {
   protected _template: TemplateFunction = template;
   protected _count: number = 0;
   protected _color: string = 'red';

   constructor(props: object) {
      super(props);
      this.add = this.add.bind(this);
      this.remove = this.remove.bind(this);
      this.changeColor = this.changeColor.bind(this);
   }

   protected add(): void {
      this._count++;
   }

   protected remove(): void {
      this._count--;
   }

   protected changeColor(): void {
      this._color = this._color === 'red' ? 'green' : 'red';
   }
}
