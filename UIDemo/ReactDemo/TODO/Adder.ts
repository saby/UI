import {ChangeEvent} from 'react';
import {Control, IControlOptions} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/Adder');

interface IAdderOptions extends IControlOptions {
    addNewItem: Function;
}

const defaultMessage: string = 'text';

export default class Adder extends Control<IAdderOptions> {
    protected _value: string = defaultMessage;
    protected _template: any = template;

    constructor(props: IAdderOptions) {
        super(props);
        this.changeHandler = this.changeHandler.bind(this);
        this.addNew = this.addNew.bind(this);
    }

    protected changeHandler(e: ChangeEvent<HTMLInputElement>): void {
        this._value = e.target.value;
    }

    protected addNew(): void {
        //@ts-ignore
        this._options.addNewItem(this._value);
        this._value = defaultMessage;
    }
}
