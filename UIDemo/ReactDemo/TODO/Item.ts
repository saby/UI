import {Control, IControlOptions} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/Item');

export interface IItem extends IControlOptions {
    title: string;
    removeHandler: Function;
}

class Item extends Control<IItem> {
    static _styles: string[] = ['UIDemo/ReactDemo/TODO/Item'];
}

// @ts-ignore
Item.prototype._template = template;

export default Item;
