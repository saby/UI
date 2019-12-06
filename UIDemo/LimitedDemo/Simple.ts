/// <amd-module name="UIDemo/LimitedDemo/Simple" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/LimitedDemo/Simple');

class Simple extends Control {
    public _template: Function = template;

    private _state: boolean = false;
    private _isClear: boolean = false;
    private _timeOut: number = 500;
    private _actionClick: number = 0;

    public _beforeMount() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this._state = true;
                resolve(true);
            }, this._timeOut);
        });
    }

    public _clearHandler() {
        this._isClear = !this._isClear;
    }

    public _actionHandler() {
        this._actionClick++;
    }
}

Simple._styles = ['UIDemo/LimitedDemo/Simple'];

export = Simple;
