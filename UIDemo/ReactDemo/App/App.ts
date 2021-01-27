import {Control} from 'UI/Base';

// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/App/App';
import {RecordSet} from 'Types/collection';
import {Guid, Model} from 'Types/entity';

export default class App extends Control {
   protected _template: any = template;
   protected _itemsArray: any[] = [{id: Guid.create(), title: 'Hello', checked: true}];
   protected _itemsRS: RecordSet = new RecordSet({
      keyProperty: 'id'
   });

   protected _beforeMount(): void {
      this._changeHandlerArray = this._changeHandlerArray.bind(this);
      this._itemsRS.add(Model.fromObject({id: Guid.create(), title: 'Hello', checked: true}));
   }

   protected _changeHandlerArray(item: any): void {
      this._itemsArray = this._itemsArray.map((el) => {
         if (el.id === item.id) {
            el.checked = !el.checked;
            return el;
         }
         return el;
      });
   }

   protected _changeHandlerRS(item: Model): void {
      item.set({checked: !item.get('checked')});
   }
}
