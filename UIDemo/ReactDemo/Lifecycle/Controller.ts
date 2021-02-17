import {Control, TemplateFunction} from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/Lifecycle/Controller';
import 'css!UIDemo/ReactDemo/Lifecycle/Controller';
import LoggerService from 'UIDemo/ReactDemo/Lifecycle/Logger/LoggerService';

export default class LifecycleController extends Control {
    protected _template: TemplateFunction = template;
    protected value: boolean = false;
    protected logs: string[] = [];
    protected show: boolean = true;
    protected showAsync: boolean = false;
    protected toggleHandler: () => void;
    protected hideHandler: () => void;
    protected clearHandler: () => void;
    protected asyncHandler: () => void;
    protected _hideBtn: HTMLElement;
    protected _clearBtn: HTMLElement;
    protected _asyncBtn: HTMLElement;
    private logger: LoggerService = LoggerService.getInstance();

    constructor(...args: [object]) {
        super(...args);
        this.toggleHandler = () => {
            this.value = !this.value;
            this._forceUpdate();
        };
        this.hideHandler = () => {
            this.show = !this.show;
            this._forceUpdate();
        };
        this.clearHandler = () => {
            this.logger.clear();
        };
        this.asyncHandler = () => {
            this.showAsync = !this.showAsync;
            this._forceUpdate();
        };
    }

    protected _afterMount(options?: {}, context?: object) {
        // Костыль с использованием глобальной переменной
        // Проверяем вызов _beforeUnmount у дочернего контрола Checkbox, уберем как покроем настоящими тестами
        // @ts-ignore
        window.reactDemoCheckboxMount = true;
        this._hideBtn = this._children.hideButton as HTMLElement;
        this._clearBtn = this._children.clearLogs as HTMLElement;
        this._asyncBtn = this._children.asyncBtn as HTMLElement;
        this._hideBtn.addEventListener('click', this.hideHandler);
        this._asyncBtn.addEventListener('click', this.asyncHandler);
        this._clearBtn.addEventListener('click', this.clearHandler);
    }

    protected _afterUpdate(oldOptions?: {}, oldContext?: any) {
        if (!this.show) {
            //@ts-ignore
            const success = this.show === window.reactDemoCheckboxMount;
            this.logger.add(
                `"_beforeUnmount" - вызван
                Компонент: Checkbox`, success);
        }
    }

    protected _beforeUnmount() {
        this._hideBtn.removeEventListener('click', this.hideHandler);
        this._clearBtn.removeEventListener('click', this.clearHandler);
        this._asyncBtn.removeEventListener('click', this.asyncHandler);
    }
}
