import {Control, TemplateFunction} from 'UICore/Base';
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

    protected _afterMount(options?: {}, context?: object): void {
        (this._children.increment as HTMLElement).addEventListener('click', this._increment);
        (this._children.decrement as HTMLElement).addEventListener('click', this._decrement);
        (this._children.check as HTMLElement).addEventListener('input', this._boolChange);
        (this._children.text as HTMLElement).addEventListener('input', this._textChange);
    }

    protected _beforeUnmount(): void {
        super._beforeUnmount();
        (this._children.increment as HTMLElement).removeEventListener('click', this._increment);
        (this._children.decrement as HTMLElement).removeEventListener('click', this._decrement);
        (this._children.check as HTMLElement).removeEventListener('input', this._boolChange);
        (this._children.text as HTMLElement).removeEventListener('input', this._textChange);
    }

    _textChange(e: Event): void {
        this._string = (e.target as HTMLInputElement).value;
    }

    _increment(): void {
        this._count++;
    }

    _decrement(): void {
        this._count--;
    }

    _boolChange(): void {
        this._bool = !this._bool;
    }
}
