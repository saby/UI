import {TemplateFunction} from 'UI/Base';
import {Control, IControlOptions} from 'UI/ReactComponent';
import * as template from 'wml!UIDemo/ReactDemo/Lifecycle/Lifecycle';

interface LifecycleOptions extends IControlOptions {
    addLog: (string) => void;
    value: number;
}

export default class Lifecycle extends Control<LifecycleOptions> {
    protected _template: TemplateFunction = template;

    protected _beforeMount(options: LifecycleOptions): void {
        options.addLog(`_beforeMount,
        options: ${JSON.stringify(options)}`);
    }

    protected _afterMount(options: LifecycleOptions, context?: object) {
        options.addLog(`_afterMount,
        options: ${JSON.stringify(options)}`);
    }

    protected _shouldUpdate(options: LifecycleOptions, context?: object): boolean {
        options.addLog(`_shouldUpdate,
        newOptions:, ${JSON.stringify(options)},
        currentOptions: ${JSON.stringify(this._options)}`);
        return options.value !== this._options.value;
    }

    protected _beforeUpdate(newOptions: LifecycleOptions, newContext?: object) {
        newOptions.addLog(`_beforeUpdate
        newOptions: ${JSON.stringify(newOptions)},
        currentOptions: ${JSON.stringify(this._options)}`);
    }

    protected _afterRender(oldOptions: LifecycleOptions, oldContext?: any) {
        this._options.addLog(`_afterRender,
        oldOptions: ${JSON.stringify(oldOptions)},
        currentOptions: ${JSON.stringify(this._options)}`);
    }

    protected _afterUpdate(oldOptions: LifecycleOptions, oldContext?: object) {
        this._options.addLog(`_afterUpdate,
        oldOptions: ${JSON.stringify(oldOptions)},
        currentOptions: ${JSON.stringify(this._options)}`);
    }

    protected _beforeUnmount() {
        this._options.addLog('_beforeUnmount');
    }
}
