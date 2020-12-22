import {Control, IControlOptions} from 'UI/ReactComponent';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/Item');

export interface IItem extends IControlOptions {
    title: string;
    removeHandler: Function;
}

class Item extends Control<IItem> {
    protected checked: boolean = false;
    protected removeHandler;

    constructor(props: IItem) {
        super(props);
        this.removeHandler = props.removeHandler;
    }
}

// @ts-ignore
Item.prototype._template = template;

export default Item;
