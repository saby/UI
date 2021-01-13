import {Control} from 'UI/ReactComponent';
import 'css!UIDemo/ReactDemo/TODO/TODO';
import {IItem} from './interfaces';

// @ts-ignore
import template = require('wml!UIDemo/ReactDemo/TODO/TODO');

class Todo extends Control {
    protected list: IItem[] = [{id: 1, title: 'Hello'}];

    constructor(props: object) {
        super(props);
        this.removeHandler = this.removeHandler.bind(this);
        this.addNewItem = this.addNewItem.bind(this);
    }

    protected removeHandler(id: number): void {
        this.list = this.list.filter((item) => item.id !== id);
    }

    protected addNewItem(val: string): void {
        this.list = [...this.list, {id: this.list.length + 1, title: val}];
    }
}
// @ts-ignore
Todo.prototype._template = template;

export default Todo;