import {Control, TemplateFunction} from 'UI/ReactComponent';
import {IList} from './interfaces';
import 'css!UIDemo/ReactDemo/TODO/List';

const SLEEP_TIME = 1500;

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/List');

export default class List extends Control<IList> {
    protected _template: TemplateFunction = template;

    protected _beforeMount(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, SLEEP_TIME);
        });
    }
}
