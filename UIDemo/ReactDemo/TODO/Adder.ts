import {ChangeEvent, createElement} from 'react';
import {Control, IControlOptions, ITemplateFunction} from 'UI/ReactComponent';

interface IAdder extends IControlOptions<Adder> {
    addNewHandler: Function;
}

export default class Adder extends Control<IAdder> {
    protected _value: string = '';

    constructor(props: IAdder) {
        super(props);
        this._template.reactiveProps = ['_value'];
    }

    protected _template: ITemplateFunction = (props: IAdder) => {
        return createElement('div', null, [
            createElement('input', {
                key: 'input',
                type: 'text',
                value: props._$wasabyInstance._value,
                onChange: (e: ChangeEvent<HTMLInputElement>) => props._$wasabyInstance.changeHandler(e)
            }),
            createElement('button', {
                key: 'button',
                disabled: !props._$wasabyInstance._value,
                onClick: () => props._$wasabyInstance.addNew()
            }, 'Add new')
        ]);
    };

    protected changeHandler(e: ChangeEvent<HTMLInputElement>): void {
        this._value = e.target.value;
    }

    protected addNew(): void {
        this._options.addNewHandler(this._value);
        this._value = '';
    }
}
