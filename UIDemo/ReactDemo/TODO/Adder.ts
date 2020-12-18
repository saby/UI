import {ChangeEvent, createElement} from 'react';
import {Control, IControlOptions} from 'UI/ReactComponent';

interface IAdder extends IControlOptions {
    addNewHandler: Function;
}

export default class Adder extends Control<IAdder> {
    protected _value: string = '';
    protected _template = () => {
        return createElement('div', null, [
            createElement('input', {
                key: 'input',
                type: 'text',
                value: this._value,
                onChange: (e: ChangeEvent<HTMLInputElement>) => this.changeHandler(e)
            }),
            createElement('button', {
                key: 'button',
                onClick: () => this.addNew()
            }, 'Add new')
        ]);
    };

    protected changeHandler(e: ChangeEvent<HTMLInputElement>): void {
        this._value = e.target.value;
        this.forceUpdate();
    }

    protected addNew(): void {
        this._options.addNewHandler(this._value);
        this._value = '';
        this.forceUpdate();
    }

    protected _beforeMount(): void {
        console.log('adder beforeMount');
    }

    protected _afterMount(): void {
        console.log('adder afterMount');
    }
}
