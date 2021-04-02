import {Control, TemplateFunction} from 'UI/Base';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/WasabyReactivity/Arr';
import {SyntheticEvent} from "UI/Vdom";

export default class Arr extends Control {
    protected _template: TemplateFunction = template;
    protected _array: string[] = [];
    protected _text: string = '';

    constructor(...args: [object]) {
        super(...args);
        this._addInArray = this._addInArray.bind(this);
        this._removeInArray = this._removeInArray.bind(this);
        this._textChange = this._textChange.bind(this);
    }

    _addInArray() {
        this._array.push(this._text);
        this._text = '';
    }

    _removeInArray(e: SyntheticEvent<InputEvent>) {
        this._array.splice(+(e.target as HTMLInputElement).id, 1);
    }

    _textChange(e: SyntheticEvent<InputEvent>) {
        this._text = (e.target as HTMLInputElement).value;
    }
}
