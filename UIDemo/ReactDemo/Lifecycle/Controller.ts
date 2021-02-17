import {Control, TemplateFunction} from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/Lifecycle/Controller';
import 'css!UIDemo/ReactDemo/Lifecycle/Controller';
import LoggerService from 'UIDemo/ReactDemo/Lifecycle/Logger/LoggerService';

export default class LifecycleController extends Control {
    protected _template: TemplateFunction = template;
    protected value: number = 0;
    protected color: string = 'black';
    protected logs: string[] = [];
    protected show: boolean = true;
    protected showAsync: boolean = false;
    protected addHandler: () => void;
    protected minusHandler: () => void;
    protected colorHandler: () => void;
    protected hideHandler: () => void;
    protected clearHandler: () => void;
    protected asyncHandler: () => void;
    protected _plus: HTMLElement;
    protected _minus: HTMLElement;
    protected _color: HTMLElement;
    protected _hideBtn: HTMLElement;
    protected _clearBtn: HTMLElement;
    protected _asyncBtn: HTMLElement;
    private logger: LoggerService = LoggerService.getInstance();

    constructor(...args: [object]) {
        super(...args);
        this.addHandler = () => {
            this.value++;
            this._forceUpdate();
        };
        this.minusHandler = () => {
            this.value--;
            this._forceUpdate();
        };
        this.colorHandler = () => {
            this.color = this.color === 'black' ? 'red' : 'black';
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
        // Проверяем вызов _beforeUnmount у дочернего контрола Counter, уберем как покроем настоящими тестами
        // @ts-ignore
        window.reactDemoCounterMount = true;
        this._plus = this._children.plus as HTMLElement;
        this._color = this._children.color as HTMLElement;
        this._minus = this._children.minus as HTMLElement;
        this._hideBtn = this._children.hideButton as HTMLElement;
        this._clearBtn = this._children.clearLogs as HTMLElement;
        this._asyncBtn = this._children.asyncBtn as HTMLElement;
        this._plus.addEventListener('click', this.addHandler);
        this._minus.addEventListener('click', this.minusHandler);
        this._color.addEventListener('click', this.colorHandler);
        this._hideBtn.addEventListener('click', this.hideHandler);
        this._asyncBtn.addEventListener('click', this.asyncHandler);
    }

    protected _afterUpdate(oldOptions?: {}, oldContext?: any) {
        if (!this.show) {
            //@ts-ignore
            const success = this.show === window.reactDemoCounterMount;
            this.logger.add(
                `"_beforeUnmount" - вызван
                Компонент: Counter`, success);
        }
    }

    protected _beforeUnmount() {
        this._plus.removeEventListener('click', this.addHandler);
        this._minus.removeEventListener('click', this.minusHandler);
        this._color.removeEventListener('click', this.colorHandler);
        this._hideBtn.removeEventListener('click', this.hideHandler);
        this._clearBtn.removeEventListener('click', this.clearHandler);
        this._asyncBtn.removeEventListener('click', this.asyncHandler);
    }
}
