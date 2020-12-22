import {Control} from 'UI/ReactComponent';
import {IList} from './interfaces';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/List');

class List extends Control<IList> {
    protected _beforeMount(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1500);
        });
    }
}

// @ts-ignore
List.prototype._template = template;

export default List;