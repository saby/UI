import {Control} from 'UI/ReactComponent';
import {ChangeEvent} from 'react';

// @ts-ignore
import template = require('wml!UIDemo/ReactEventDemo/Compatible/Binder');


class Binder extends Control {
    protected userText: string = '';

    constructor(props) {
        super(props);
    }

    protected _beforeMount(): void {
        this._changeHandler = this._changeHandler.bind(this);
    }

    protected _changeHandler(e: ChangeEvent<HTMLInputElement>): void {
        this.userText = e.target.value;
    }
}

// @ts-ignore
Binder.prototype._template = template;

export default Binder;
