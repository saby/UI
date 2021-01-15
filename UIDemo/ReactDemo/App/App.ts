import {Control, TemplateFunction} from 'UI/ReactComponent';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/App/App';
import 'css!UIDemo/ReactDemo/App/App';
import {RecordSet} from 'Types/collection';
import {Guid, Model, ReactiveObject} from 'Types/entity';
import {IItem} from 'UIDemo/ReactDemo/TODO/interfaces';

export default class App extends Control {
    protected _template: TemplateFunction = template;
    protected _itemsArray: IItem[] = [
        new ReactiveObject({id: Guid.create(), title: 'Array item', checked: false})
    ];
    protected _itemsRs: RecordSet = new RecordSet({keyProperty: 'id'});

    constructor(props: object) {
        super(props);
        this._changeHandlerArray = this._changeHandlerArray.bind(this);
    }

    protected _beforeMount(): void {
        this._itemsRs.add(Model.fromObject({id: Guid.create(), title: 'RecordSet item', checked: false}));
    }

    protected _changeHandlerArray(item: IItem): void {
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
