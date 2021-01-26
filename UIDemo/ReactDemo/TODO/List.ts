import {Control} from 'UI/Base';
import {IList} from './interfaces';

const SLEEP_TIME = 1500;

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/List');

class List extends Control<IList> {
    protected _beforeMount(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
      }, SLEEP_TIME);
        });
    }
}

// @ts-ignore
List.prototype._template = template;

export default List;
