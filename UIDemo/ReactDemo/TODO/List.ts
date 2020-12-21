import {createElement} from 'react';
import {Control} from 'UI/ReactComponent';
import {IList} from './interfaces';
import Item, {IItem} from './Item';

export default class List extends Control<IList> {
    protected _beforeMount(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1500);
        });
    }

    protected _template = (props: IList) => {
        return props.items.length ? createElement('ul', null,
            props.items.map((el) => createElement<IItem>(Item, {
                key: el.id,
                title: el.title,
                removeHandler: () => props.removeHandler(el.id)
            }))) : createElement('div', null, 'Список пуст');
    };
}
