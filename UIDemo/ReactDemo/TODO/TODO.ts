import {createElement} from 'react';
import {Control, IControlOptions, ITemplateFunction} from 'UI/ReactComponent';
import List from './List';
import Adder from './Adder';
import 'css!UIDemo/ReactDemo/TODO/TODO';
import {IItem} from './interfaces';

export default class Todo extends Control {
    protected list: IItem[] = [{id: 1, title: 'Hello'}];

    constructor(props: object) {
        super(props);
        this._template.reactiveProps = ['list'];
    }

    protected _template: ITemplateFunction = (props: IControlOptions<Todo>) => {
        return createElement('div', {className: 'demo-Todo'}, [
            createElement(List, {items: this.list, key: 'list', removeHandler: (id) => this.removeHandler(id)}),
            createElement(Adder, {
                key: 'adder',
                addNewHandler: (val) => props._$wasabyInstance.addNewItem(val)
            })
        ]);
    };

    protected removeHandler(id: number): void {
        this.list = this.list.filter((item) => item.id !== id);
    }

    protected addNewItem(val: string): void {
        this.list = [...this.list, {id: this.list.length + 1, title: val}];
    }
}
