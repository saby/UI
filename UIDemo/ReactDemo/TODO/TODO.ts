import {
   Control,
   IControlOptions,
   TemplateFunction
} from 'UI/Base';
import {IItem} from './interfaces';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/TODO');
import {Model, Guid, ReactiveObject} from 'Types/entity';
import {RecordSet} from 'Types/collection';
import { IWasabyContextValue } from 'UI/_react/WasabyContext/WasabyContext';

interface ITodoOptions extends IControlOptions {
   items: IItem[] | RecordSet;
}

export default class Todo extends Control<ITodoOptions> {
   protected _template: TemplateFunction = template;

   constructor(...args: [ITodoOptions, IWasabyContextValue]) {
      super(...args);
      this.removeHandler = this.removeHandler.bind(this);
      this.addNewItem = this.addNewItem.bind(this);
      this.changeHandler = this.changeHandler.bind(this);
   }

   protected removeHandler(item: IItem | Model): void {
      const items = this._options.items;

      if (items instanceof RecordSet && item instanceof Model) {
         items.remove(item);
      } else if (Array.isArray(items)) {
         const index = items.indexOf(item as IItem);
         items.splice(index, 1);
      }
   }

   protected changeHandler(item: IItem | Model): void {
      const items = this._options.items;

      if (item instanceof Model) {
         item.set({checked: !item.get('checked')});
      } else if (Array.isArray(items)) {
         item.checked = !item.checked;
      }
   }

   protected addNewItem(val: string): void {
      const newItem = {id: Guid.create(), title: val, checked: false};
      const items = this._options.items;

      if (Array.isArray(items)) {
         items.push(new ReactiveObject(newItem));
      } else {
         items.add(Model.fromObject(newItem));
      }
   }

   static _styles: string[] = ['UIDemo/ReactDemo/TODO/TODO'];
   static _theme: string[] = ['UIDemo/ThemesDemo/ThemedControl'];
}
