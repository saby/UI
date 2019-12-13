/// <amd-module name="UIDemo/LimitedDemo/Simple" />

import {Control, TemplateFunction, IControlOptions} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/LimitedDemo/Simple');
import { INestedState } from './Nested';

class Simple extends Control<IControlOptions, INestedState> {
    public _template: TemplateFunction = template;

    protected _state: boolean = false;
    private _isClear: boolean = false;
    private _timeOut: number = 500;
    protected _actionClick: number = 0;

    public _beforeMount(): Promise<INestedState> {
        return new Promise((resolve) => {
            setTimeout(() => {
                this._state = true;
                resolve({ _state: true });
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
