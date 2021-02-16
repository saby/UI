import {TemplateFunction} from 'UI/Base';
import {Control} from 'UI/ReactComponent';
import * as template from 'wml!UIDemo/ReactDemo/Lifecycle/Controller';
import LoggerService from "UIDemo/ReactDemo/Lifecycle/Logger/LoggerService";
import 'css!UIDemo/ReactDemo/Lifecycle/Controller';

export default class LifecycleController extends Control {
    protected _template: TemplateFunction = template;
    protected value: number = 0;
    protected logs: string[] = [];
    protected show: boolean = true;
    protected showAsync: boolean = false;
    protected addHandler: () => void;
    protected hideHandler: () => void;
    protected clearHandler: () => void;
    protected asyncHandler: () => void;
    protected _btn: HTMLElement;
    protected _hideBtn: HTMLElement;
    protected _clearBtn: HTMLElement;
    protected _asyncBtn: HTMLElement;
    protected logger = LoggerService.getInstance();

    constructor(...args: [object]) {
        super(...args);
        this.addLog = this.addLog.bind(this);
        this.addHandler = () => {
            this.changeValue();
        };
        this.hideHandler = () => {
            this.show = !this.show;
            this.forceUpdate();
        };
        this.clearHandler = () => {
            this.logger.clear();
        };
        this.asyncHandler = () => {
            this.showAsync = !this.showAsync;
            this.forceUpdate();
        };
    }

    protected _afterMount(options?: {}, context?: object) {
        this._btn = this._children.button as HTMLElement;
        this._hideBtn = this._children.hideButton as HTMLElement;
        this._clearBtn = this._children.clearLogs as HTMLElement;
        this._asyncBtn = this._children.asyncBtn as HTMLElement;
        this._btn.addEventListener('click', this.addHandler);
        this._hideBtn.addEventListener('click', this.hideHandler);
        this._clearBtn.addEventListener('click', this.clearHandler);
        this._clearBtn.addEventListener('click', this.clearHandler);
        this._asyncBtn.addEventListener('click', this.asyncHandler);
    }

    protected _beforeUnmount() {
        this._btn.removeEventListener('click', this.addHandler);
        this._hideBtn.removeEventListener('click', this.hideHandler);
        this._clearBtn.removeEventListener('click', this.clearHandler);
        this._asyncBtn.removeEventListener('click', this.asyncHandler);
    }

    changeValue(): void {
        this.value++;
        this.forceUpdate();
    }

    addLog(log: string): void {
        this.logger.add(log);
    }
}
