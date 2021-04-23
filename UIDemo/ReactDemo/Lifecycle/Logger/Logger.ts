import {Control, TemplateFunction} from 'UI/Base';
import LoggerService, {ILog} from './LoggerService';
import * as template from 'wml!UIDemo/ReactDemo/Lifecycle/Logger/Logger';
import 'css!UIDemo/ReactDemo/Lifecycle/Logger/Logger';

export default class Logger extends Control {
    protected _template: TemplateFunction = template;
    private logger = LoggerService.getInstance();
    protected logs: ILog[];

    protected _beforeMount(): void {
        this.logs = this.logger.get();
    }

    protected _afterMount(): void {
        this.logger.subscribe((newLogs) => {
            this.logs = newLogs;
            this._forceUpdate();
        });
    }
}
