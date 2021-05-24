import { Async, TAsyncStateReceived, IAsyncOptions } from 'UICore/Async';

/**
 * Реализация класса UICore/Async:Async для тестов
 */
export default class AsyncTest extends Async {
    _beforeMount(options: IAsyncOptions, _: unknown = null,
                 receivedState: TAsyncStateReceived = ''): Promise<TAsyncStateReceived> {
        return super._beforeMount(options, _, receivedState);
    }

    _componentDidMount(): void {
        super._componentDidMount();
    }

    _beforeUpdate(opts: IAsyncOptions): void {
        super._beforeUpdate(opts);
    }

    _afterUpdate(): void {
        super._afterUpdate();
    }

    getError(): TAsyncStateReceived | void {
        return this.error;
    }

    getCurrentTemplateName(): string {
        return this.currentTemplateName;
    }

    getOptionsForComponent(): Record<string, unknown> {
        return this.optionsForComponent;
    }
}
