import {ChangeEvent} from 'react';
import {Control} from 'UI/ReactComponent';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/Adder');

class Adder extends Control {
    protected _value: string = '???';

    constructor(props) {
        super(props);
        this.changeHandler = this.changeHandler.bind(this);
        this.addNew = this.addNew.bind(this);
    }

    protected changeHandler(e: ChangeEvent<HTMLInputElement>): void {
        this._value = e.target.value;
    }

    protected addNew(): void {
        //@ts-ignore
        this._options.addNewItem(this._value);
        this._value = '';
    }
}

// @ts-ignore
Adder.prototype._template = template;

export default Adder;