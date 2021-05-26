// @ts-nocheck
import { Async, IAsyncOptions } from 'UICore/Async';

/**
 * Реализация класса UICore/Async:Async для тестов
 */
export default class AsyncTest extends Async<IAsyncOptions> {
    getError(): string | void {
        return this.error;
    }

    getCurrentTemplateName(): string {
        return this.currentTemplateName;
    }

    getOptionsForComponent(): Record<string, unknown> {
        return this.optionsForComponent;
    }

    _notify(eventName: string): unknown {
        return super._notify(eventName);
    }
}
