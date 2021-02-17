import {Control, TemplateFunction} from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/Lifecycle/AsyncMount';
import {isEqual} from "Types/object";
import LoggerService from 'UIDemo/ReactDemo/Lifecycle/Logger/LoggerService';

export default class AsyncMount extends Control {
    protected _template: TemplateFunction = template;
    protected _asyncMountEnd: boolean = false;
    private logger: LoggerService = LoggerService.getInstance();

    protected _beforeMount(options: object): Promise<void> {
        const success = isEqual(this._options, {});
        this.logger.add(
            `"_beforeMount" (async start) опции должны быть пустыми
            Компонент: AsyncMount`, success);
        return new Promise((res) => {
            setTimeout(() => {
                const success = isEqual(this._options, {});
                this.logger.add(
                    `"_beforeMount" (async end) опции должны быть пустыми
                    Компонент: AsyncMount`, success);
                this._asyncMountEnd = true;
                res();
            }, 1500);
        });
    }

    protected _afterMount(options: object, context?: object) {
        const success = isEqual(this._options, options);
        this.logger.add(
            `"_afterMount" не должен вызываться пока не выполнился _beforeMount (async)
            Компонент: AsyncMount`, this._asyncMountEnd);
        this.logger.add(
            `"_afterMount" опции в аргументах и на инстансе должны совпадать
            Компонент: AsyncMount`, success);
    }
}
