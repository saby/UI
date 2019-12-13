/// <amd-module name="UIDemo/LimitedDemo/Nested" />

import {Control, TemplateFunction, IControlOptions} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/LimitedDemo/Nested');

interface INestedState {
    _state: boolean
}

class Nested extends Control<IControlOptions, INestedState> {
    public _template: TemplateFunction = template;

    protected _state: boolean = false;
    private _timeOut: number = 19000;

    public _beforeMount(): Promise<INestedState> {
        return new Promise((resolve) => {
            setTimeout(() => {
                this._state = true;
                resolve({ _state: true });
            }, this._timeOut);
        });
    }
}

Nested._styles = ['UIDemo/LimitedDemo/Nested'];

export {Nested, INestedState};
