import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/Lifecycle/Checkbox';
import LoggerService from "UIDemo/ReactDemo/Lifecycle/Logger/LoggerService";
import {isEqual} from 'Types/object';

interface CheckboxOptions extends IControlOptions {
    value: boolean;
    changeHandler: () => void;
}

export default class Checkbox extends Control<CheckboxOptions> {
    protected _template: TemplateFunction = template;
    protected _label: string = 'My checkbox';
    protected logger = LoggerService.getInstance();
    private expectedValue: boolean;


    protected _beforeMount(options: CheckboxOptions): void {
        this.expectedValue = !options.value;
        const success = isEqual(this._options, {});
        this.logger.add(
            `"_beforeMount" опции должны быть пустыми
            Компонент: Checkbox`, success);
    }

    protected _componentDidMount(options: CheckboxOptions, context?: object): void {
        const success = isEqual(options, this._options);
        this.logger.add(
            `"_componentDidMount" опции в аргументах и на инстансе должны совпадать
            Компонент: Checkbox`, success);
    }

    protected _afterMount(options: CheckboxOptions, context?: object): void {
        (this._children.input as HTMLElement).addEventListener('change', options.changeHandler);
        const success = isEqual(options, this._options);
        // @ts-ignore
        window.reactDemoCheckboxMount = true;
        this.logger.add(
            `"_afterMount" опции в аргументах и на инстансе должны совпадать
            Компонент: Checkbox`, success);
    }

    protected _shouldUpdate(options: CheckboxOptions, context?: object): boolean {
        this.logger.add(
            `"_shouldUpdate" - вызван успешно
            Компонент: Checkbox`, true);
        return options.value !== this._options.value;
    }

    protected _beforeUpdate(newOptions: CheckboxOptions, newContext?: object): void {
        const successNew = newOptions.value === this.expectedValue;
        const successCur = this._options.value !== this.expectedValue;
        this.logger.add(
            `"_beforeUpdate" опция value в аргументах и на инстансе должна отличаться
            Компонент: Checkbox`, successCur && successNew);
    }

    protected _afterRender(oldOptions: CheckboxOptions, oldContext?: any): void {
        const successOld = oldOptions.value !== this.expectedValue;
        const successCur = this._options.value === this.expectedValue;
        this.logger.add(
            `"_afterRender" опция value в аргументах и на инстансе должна отличаться
            Компонент: Checkbox`, successCur && successOld);
    }

    protected _afterUpdate(oldOptions: CheckboxOptions, oldContext?: object): void {
        const successOld = oldOptions.value !== this.expectedValue;
        const successCur = this._options.value === this.expectedValue;
        this.expectedValue = !this.expectedValue;
        this.logger.add(
            `"_afterUpdate" опция value в аргументах и на инстансе должна отличаться 
            Компонент: Checkbox`, successCur && successOld);
    }

    protected _beforeUnmount(): void {
        // @ts-ignore
        window.reactDemoCheckboxMount = false;
        (this._children.input as HTMLElement).removeEventListener('click', this._options.changeHandler);
    }
}
