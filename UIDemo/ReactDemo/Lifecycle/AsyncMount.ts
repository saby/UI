import {TemplateFunction} from 'UI/Base';
import {Control, IControlOptions} from 'UI/ReactComponent';
import * as template from 'wml!UIDemo/ReactDemo/Lifecycle/AsyncMount';

interface AsyncMountOptions extends IControlOptions {
    addLog: (string) => void;
}

export default class AsyncMount extends Control<AsyncMountOptions> {
    protected _template: TemplateFunction = template;

    protected _beforeMount(options: AsyncMountOptions): Promise<void> {
        options.addLog(`Async _beforeMount start,
        options: ${JSON.stringify(options)}`);
        return new Promise((res) => {
            setTimeout(() => {
                options.addLog(`Async _beforeMount end,
        options: ${JSON.stringify(options)}`);
                res();
            }, 1500);
        });
    }

    protected _afterMount(options: AsyncMountOptions, context?: object) {
        options.addLog(`Async _afterMount,
        options: ${JSON.stringify(options)}`);
    }
}
