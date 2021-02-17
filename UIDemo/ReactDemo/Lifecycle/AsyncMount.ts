import {Control, TemplateFunction} from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/Lifecycle/AsyncMount';
import {isEqual} from "Types/object";

export default class AsyncMount extends Control {
    protected _template: TemplateFunction = template;
    protected _asyncMountEnd: boolean = false;

    protected _beforeMount(options: object): Promise<void> {
        console.assert(isEqual(this._options, {}), 'В хуке _beforeMount опции должны быть пустыми');
        return new Promise((res) => {
            setTimeout(() => {
                console.assert(isEqual(this._options, {}), 'В хуке _beforeMount опции должны быть пустыми');
                this._asyncMountEnd = true;
                res();
            }, 1500);
        });
    }

    protected _afterMount(options: object, context?: object) {
        console.assert(this._asyncMountEnd, 'Хук _afterMount не должен вызываться пока не выполнился _beforeMount');
        console.assert(isEqual(options, this._options), 'В хуке _afterMount опции в аргументах и на инстансе должны совпадать');
    }
}
