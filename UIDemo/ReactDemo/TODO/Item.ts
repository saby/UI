import {Control, IControlOptions} from 'UI/Base';
import 'css!UIDemo/ReactDemo/TODO/Item';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/Item');

export interface IItem extends IControlOptions {
    title: string;
    removeHandler: Function;
}

class Item extends Control<IItem> {
}

// @ts-ignore
Item.prototype._template = template;

export default Item;
