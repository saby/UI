import {Control} from 'UICore/Base';
import { TemplateFunction } from 'UICommon/Base';
// @ts-ignore
import * as template from 'wml!UICore/ReactDemo/WasabyReactivity/Controller';
import 'css!UICore/ReactDemo/WasabyReactivity/Controller';

interface ITab {
    name: string;
    id: string;
}

export default class Controller extends Control {
    protected _template: TemplateFunction = template;
    protected _tabs: ITab[] = [
        {name: 'Примитивы', id: 'primitive'},
        {name: 'Массив', id: 'array'},
        {name: 'Record & RecordSet', id: 'rec'}];
    protected activeTab: string = 'primitive';

    constructor(...args: [object]) {
        super(...args);
        this._changeActiveTab = this._changeActiveTab.bind(this);
    }

    protected _afterMount(options?: {}, context?: object): void {
        this._tabs.forEach((tab) => {
            (this._children[tab.id] as HTMLElement).addEventListener('click', this._changeActiveTab);
        });
    }

    protected _beforeUnmount(): void {
        this._tabs.forEach((tab) => {
            (this._children[tab.id] as HTMLElement).removeEventListener('click', this._changeActiveTab);
        });
        super._beforeUnmount();
    }

    _changeActiveTab(e: Event): void {
        this.activeTab = (e.target as HTMLInputElement).id;
    }
}
