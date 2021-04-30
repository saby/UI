import { Async, TAsyncStateReceived, IAsyncOptions } from 'UICore/Async';

/**
 * Реализация класса UICore/Async:Async для тестов
 */
export default class AsyncTest extends Async {
    _beforeMount(options: IAsyncOptions): void {
        super._beforeMount(options);
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
