import {Control, TemplateFunction, IControlOptions} from 'UI/ReactComponent';
import {IItem} from './interfaces';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/TODO');
import {Model, Guid, ReactiveObject} from 'Types/entity';
import {RecordSet} from 'Types/collection';

interface ITodoOptions extends IControlOptions {
    items: IItem[] | RecordSet;
}

export default class Todo extends Control<ITodoOptions> {
    protected _template: TemplateFunction = template;

    constructor(props: ITodoOptions) {
        super(props);
        this.removeHandler = this.removeHandler.bind(this);
        this.addNewItem = this.addNewItem.bind(this);
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

    protected addNewItem(val: string): void {
        const newItem = {id: Guid.create(), title: val, checked: false};
        const items = this._options.items;

        if (Array.isArray(items)) {
            items.push(new ReactiveObject(newItem));
        } else {
            items.add(Model.fromObject(newItem));
        }
    }
}
