/// <amd-module name="UIDemo/LimitedDemo/Nested" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/LimitedDemo/Nested');

class Nested extends Control {
    public _template: Function = template;

    private _state: boolean = false;
    private _timeOut: number = 2000;

    public _beforeMount() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this._state = true;
                resolve(true);
            }, this._timeOut);
        });
    }
}

Nested._styles = ['UIDemo/LimitedDemo/Nested'];

export = Nested;
