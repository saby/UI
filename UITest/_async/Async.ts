import { Async, TAsyncStateReceived, IAsyncOptions } from 'UICore/Async';

/**
 * Реализация класса UICore/Async:Async для тестов
 */
export default class AsyncTest extends Async {
    _beforeMount(options: IAsyncOptions, _: unknown = null, receivedState: TAsyncStateReceived = ''): Promise<TAsyncStateReceived> {
        // @ts-ignore
        return super._beforeMount(options, _, receivedState);
    }

    _componentDidMount() {
        super._componentDidMount();
    }

    _beforeUpdate(opts: IAsyncOptions) {
        super._beforeUpdate(opts);
    }

    _afterUpdate() {
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
