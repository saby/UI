import {createElement} from 'react';
import {Control, IControlOptions, ITemplateFunction} from 'UI/ReactComponent';

export interface IItem extends IControlOptions {
    title: string;
    removeHandler: Function;
}

export default class Item extends Control<IItem> {
    protected checked: boolean = false;

    constructor(props: IItem) {
        super(props);
        this._template.reactiveProps = ['checked'];
    }

    protected _template: ITemplateFunction = (props: IItem) => {
        return createElement('li', {
            className: this.checked ? 'item-checked item' : 'item',
            onClick: () => this._changeHandler()
        }, [props.title, createElement('button', {
            className: 'item__button',
            onClick: () => this.props.removeHandler()
        }, 'Удалить')]);
    };

    protected _changeHandler(): void {
        this.checked = !this.checked;
    }
}
