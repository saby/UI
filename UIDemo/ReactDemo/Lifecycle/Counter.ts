import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
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

    protected _afterMount(options: CounterOptions, context?: object): void {
        // @ts-ignore
        window.reactDemoCounterMount = true;
        console.assert(isEqual(options, this._options), 'В хуке _afterMount опции в аргументах и на инстансе должны совпадать');
    }

    protected _shouldUpdate(options: CounterOptions, context?: object): boolean {
        return options.value !== this._options.value;
    }

    protected _beforeUpdate(newOptions: CounterOptions, newContext?: object): void {
        console.assert(newOptions.value !== this._options.value, 'В хуке _beforeUpdate опция value в аргументах и на инстансе должна отличаться');
    }

    protected _afterRender(oldOptions: CounterOptions, oldContext?: any): void {
        console.assert(oldOptions.value !== this._options.value, 'В хуке _afterRender опция value в аргументах и на инстансе должна отличаться');
    }

    protected _afterUpdate(oldOptions: CounterOptions, oldContext?: object): void {
        console.assert(oldOptions.value !== this._options.value, 'В хуке _afterUpdate опция value в аргументах и на инстансе должна отличаться');
    }

    protected _beforeUnmount(): void {
        // @ts-ignore
        window.reactDemoCounterMount = false;
    }
}
