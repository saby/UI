/// <amd-module name="UIDemo/LimitedDemo/NestedLongOther" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/LimitedDemo/NestedLongOther');

class NestedLongOther extends Control {
    public _template: Function = template;

    private _state: boolean = false;
    private _timeOut: number = 1000;

    public _beforeMount() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this._state = true;
                resolve(true);
            }, this._timeOut);
        });
    }
}

NestedLongOther._styles = ['UIDemo/LimitedDemo/NestedLongOther'];

export = NestedLongOther;
