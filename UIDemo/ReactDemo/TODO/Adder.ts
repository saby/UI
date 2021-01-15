import {ChangeEvent} from 'react';
import {Control, TemplateFunction, IControlOptions} from 'UI/ReactComponent';
// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/Adder');

interface IAdderOptions extends IControlOptions {
    addNewItem: Function;
}

const defaultMessage: string = 'text';

export default class Adder extends Control<IAdderOptions> {
    protected _value: string = defaultMessage;
    protected _template: TemplateFunction = template;

    constructor(props: IAdderOptions) {
        super(props);
        this.changeHandler = this.changeHandler.bind(this);
        this.addNew = this.addNew.bind(this);
    }

    protected changeHandler(e: ChangeEvent<HTMLInputElement>): void {
        this._value = e.target.value;
    }

    protected addNew(): void {
        this._options.addNewItem(this._value);
        this._value = defaultMessage;
    }
}
