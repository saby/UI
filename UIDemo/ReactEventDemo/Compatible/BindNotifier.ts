import {Control} from 'UI/ReactComponent';
import {ChangeEvent} from 'react';

// @ts-ignore
import template = require('wml!UIDemo/ReactEventDemo/Compatible/BindNotifier');


class BindNotifier extends Control {
    protected bindValue: string = '';

    constructor(props) {
        super(props);
    }

    protected _beforeMount(): void {
        this._changeHandler = this._changeHandler.bind(this);
    }

    protected _changeHandler(e: ChangeEvent<HTMLInputElement>): void {
        this.bindValue = e.target.value;
        this._notify('valueChanged', [e.target.value]);
    }
}

// @ts-ignore
BindNotifier.prototype._template = template;

export default BindNotifier;
