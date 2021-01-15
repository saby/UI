import {Control, IControlOptions, TemplateFunction} from 'UI/ReactComponent';
import 'css!UIDemo/ReactDemo/TODO/Item';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/Item');

export interface IItem extends IControlOptions<Item> {
    title: string;
    removeHandler: Function;
    changeHandler: Function;
}

export default class Item extends Control<IItem> {
    protected _template: TemplateFunction = template;
}
