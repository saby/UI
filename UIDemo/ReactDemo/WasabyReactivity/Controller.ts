import {Control, TemplateFunction} from 'UI/Base';
import {SyntheticEvent} from 'UI/Vdom';
// @ts-ignore
import template from 'wml!UIDemo/ReactDemo/WasabyReactivity/Controller';
import 'css!UIDemo/ReactDemo/WasabyReactivity/Controller';

export default class Controller extends Control {
    protected _template: TemplateFunction = template;
    protected _tabs: object[] = [
        {name: 'Примитивы', id: 'primitive'},
        {name: 'Массив', id: 'array'},
        {name: 'Record & RecordSet', id: 'rec'}];
    protected activeTab: string = 'primitive';

    constructor(...args: [object]) {
        super(...args);
        this._changeActiveTab = this._changeActiveTab.bind(this);
    }

    _changeActiveTab(e: SyntheticEvent<Event>) {
        this.activeTab = (e.target as HTMLInputElement).id;
    }
}
