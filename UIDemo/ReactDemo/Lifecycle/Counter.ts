import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/Lifecycle/Counter';
import LoggerService from "UIDemo/ReactDemo/Lifecycle/Logger/LoggerService";
import {isEqual} from 'Types/object';

interface CounterOptions extends IControlOptions {
    value: number;
}

export default class Counter extends Control<CounterOptions> {
    protected _template: TemplateFunction = template;
    protected logger = LoggerService.getInstance();

    protected _beforeMount(options: CounterOptions): void {
        const success = isEqual(this._options, {});
        this.logger.add(
            `"_beforeMount" опции должны быть пустыми
            Компонент: Counter`, success);
    }

    protected _afterMount(options: CounterOptions, context?: object): void {
        const success = isEqual(options, this._options);
        // @ts-ignore
        window.reactDemoCounterMount = true;
        this.logger.add(
            `"_afterMount" опции в аргументах и на инстансе должны совпадать
            Компонент: Counter`, success);
    }

    protected _shouldUpdate(options: CounterOptions, context?: object): boolean {
        this.logger.add(
            `"_shouldUpdate" - вызван успешно
            Компонент: Counter`, true);
        return options.value !== this._options.value;
    }

    protected _beforeUpdate(newOptions: CounterOptions, newContext?: object): void {
        const success = newOptions.value !== this._options.value;
        this.logger.add(
            `"_beforeUpdate" опция value в аргументах и на инстансе должна отличаться
            Компонент: Counter`, success);
    }

    protected _afterRender(oldOptions: CounterOptions, oldContext?: any): void {
        const success = oldOptions.value !== this._options.value;
        this.logger.add(
            `"_afterRender" опция value в аргументах и на инстансе должна отличаться
            Компонент: Counter`, success);
    }

    protected _afterUpdate(oldOptions: CounterOptions, oldContext?: object): void {
        const success = oldOptions.value !== this._options.value;
        this.logger.add(
            `"_afterUpdate" опция value в аргументах и на инстансе должна отличаться 
            Компонент: Counter`, success);
    }

    protected _beforeUnmount(): void {
        // @ts-ignore
        window.reactDemoCounterMount = false;
    }
}
