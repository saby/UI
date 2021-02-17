import {TemplateFunction} from 'UI/Base';
import {Control, IControlOptions} from 'UI/ReactComponent';
import * as template from 'wml!UIDemo/ReactDemo/Lifecycle/Counter';
import {isEqual} from 'Types/object';

interface CounterOptions extends IControlOptions {
    value: number;
}

export default class Counter extends Control<CounterOptions> {
    protected _template: TemplateFunction = template;

    protected _beforeMount(options: CounterOptions): void {
        console.assert(isEqual(this._options, {}), 'В хуке _beforeMount опции должны быть пустыми');
    }

    protected _afterMount(options: CounterOptions, context?: object) {
        console.assert(isEqual(options, this._options), 'В хуке _afterMount опции в аргументах и на инстансе должны совпадать');
    }

    protected _shouldUpdate(options: CounterOptions, context?: object): boolean {
        return options.value !== this._options.value;
    }

    protected _beforeUpdate(newOptions: CounterOptions, newContext?: object) {
        console.assert(!isEqual(newOptions, this._options), 'В хуке _beforeUpdate опции в аргументах и на инстансе должны отличаться');
    }

    protected _afterRender(oldOptions: CounterOptions, oldContext?: any) {
        console.assert(!isEqual(oldOptions, this._options), 'В хуке _afterRender опции в аргументах и на инстансе должны отличаться');
    }

    protected _componentDidUpdate(oldOptions?: CounterOptions, oldContext?: any) {
        console.assert(!isEqual(oldOptions, this._options), 'В хуке _componentDidUpdate опции в аргументах и на инстансе должны отличаться');
    }

    protected _afterUpdate(oldOptions: CounterOptions, oldContext?: object) {
        console.assert(!isEqual(oldOptions, this._options), 'В хуке _afterUpdate опции в аргументах и на инстансе должны отличаться');
    }
}
