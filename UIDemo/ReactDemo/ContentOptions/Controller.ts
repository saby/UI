import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/ContentOptions/Controller';

class Counter {
    private _value: number;
    private _version: number;

    constructor() {
        this._value = 0;
        this._version = 0;
    }

    get value(): number {
        return this._value;
    }

    increment(): void {
        ++this._value;
        ++this._version;
    }

    getVersion(): number {
        return this._version;
    }
}

export default class LifecycleController extends Control {
    protected _template: TemplateFunction = template;
    protected counter: Counter = new Counter();

    protected _afterMount(options: any, context?: object): void {
        // @ts-ignore
        (this._children.button as HTMLElement).addEventListener('click', () => {
            // @ts-ignore
            console.log('Controller: counter.increment()');
            this.counter.increment();
            // @ts-ignore
            this._forceUpdate();
        });
    }

    protected _afterUpdate(oldOptions?: any, oldContext?: object): void {
        super._afterUpdate(oldOptions, oldContext);
        // @ts-ignore
        console.log('Controller: _afterUpdate() was called');
    }
}