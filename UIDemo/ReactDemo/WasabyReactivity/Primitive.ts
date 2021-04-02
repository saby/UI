import {Control, TemplateFunction} from 'UI/Base';
import { SyntheticEvent } from 'UI/Vdom';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/WasabyReactivity/Primitive';

export default class Primitive extends Control {
    protected _template: TemplateFunction = template;
    protected _count: number = 0;
    protected _string: string = '';
    protected _bool: boolean = false;

    constructor(...args: [object]) {
        super(...args);
        this._increment = this._increment.bind(this);
        this._decrement = this._decrement.bind(this);
        this._textChange = this._textChange.bind(this);
        this._boolChange = this._boolChange.bind(this);
    }
    _textChange(e: SyntheticEvent<InputEvent>) {
        this._string = (e.target as HTMLInputElement).value;
    }
    _increment() {
        this._count++;
    }
    _decrement() {
        this._count--;
    }
    _boolChange() {
        this._bool = !this._bool;
    }
}
