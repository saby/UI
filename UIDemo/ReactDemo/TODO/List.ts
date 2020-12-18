import {createElement} from 'react';
import {Control} from 'UI/ReactComponent';
import {IList} from './interfaces';
import Item, {IItem} from './Item';

export default class List extends Control<IList> {
    protected _beforeMount(): Promise<void> {
        console.log('list beforeMountStart');
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('list beforeMountEnd');
                resolve();
            }, 1500);
        });
    }

    protected _afterMount(): void {
        console.log('list afterMount');
    }

    protected _beforeUpdate(newOptions: IList): void {
        console.log('list beforeUpdate', this._options, newOptions);
    }

    protected _template = (props: IList) => {
        return createElement('ul', null,
            props.items.map((el) => createElement<IItem>(Item, {
                key: el.id,
                title: el.title,
                removeHandler: () => props.removeHandler(el.id)
            })));
    };
}
