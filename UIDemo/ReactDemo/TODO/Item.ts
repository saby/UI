import {createElement} from 'react';
import {Control, IControlOptions} from 'UI/ReactComponent';

export interface IItem extends IControlOptions {
    title: string;
    removeHandler: Function;
}

export default class Item extends Control<IItem> {
    protected _value: string = '';
    protected checked: boolean = false;
    protected _template: any = (props: IItem) => {
        return [createElement('li', {
            className: this.checked ? 'item-checked item' : 'item',
            onClick: () => this._changeHandler()
        }, [props.title, createElement('button', {
            className: 'item__button',
            onClick: () => this.props.removeHandler()
        }, 'Удалить')])];
    };

    protected _changeHandler(): void {
        this.checked = !this.checked;
        this.forceUpdate();
    }
}
