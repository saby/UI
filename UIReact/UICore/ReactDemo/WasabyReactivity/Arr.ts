import {Control, TemplateFunction} from 'UICore/Base';
// @ts-ignore
import * as template from 'wml!UICore/ReactDemo/WasabyReactivity/Arr';

export default class Arr extends Control {
    protected _template: TemplateFunction = template;
    protected _array: string[] = [];
    protected _text: string = '';

    constructor(...args: [object]) {
        super(...args);
        this._addInArray = this._addInArray.bind(this);
        this._textChange = this._textChange.bind(this);
    }

    protected _afterMount(options?: {}, context?: object): void {
        (this._children.add as HTMLElement).addEventListener('click', this._addInArray);
        (this._children.text as HTMLElement).addEventListener('input', this._textChange);
    }

    protected _beforeUnmount(options?: {}, context?: object): void {
        (this._children.add as HTMLElement).removeEventListener('click', this._addInArray);
        (this._children.text as HTMLElement).removeEventListener('input', this._textChange);
    }

    _addInArray(): void {
        this._array.push(this._text);
        this._text = '';
    }

    _textChange(e: Event): void {
        this._text = (e.target as HTMLInputElement).value;
    }
}
