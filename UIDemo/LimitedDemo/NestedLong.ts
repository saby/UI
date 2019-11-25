/// <amd-module name="UIDemo/LimitedDemo/NestedLong" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/LimitedDemo/NestedLong');

class NestedLong extends Control {
    public _template: Function = template;

    private _state: boolean = false;
    private _timeOut: number = 7000;

    public _beforeMount() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this._state = true;
                resolve(true);
            }, this._timeOut);
        });
    }
}

NestedLong._styles = ['UIDemo/LimitedDemo/NestedLong'];

export = NestedLong;
