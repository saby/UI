export type TMessageType = 'error' | 'warn' | 'info' | 'log';
export type TKeyedMessages = Record<TMessageType, string[]>;
export type TSerializableMessages = Record<string, TKeyedMessages>;
export interface ILoggerStateReceiverComponent {
    getState: () => TSerializableMessages;
    setState: (serverState: TSerializableMessages) => void;
}

/**
 * Публичное API класса KeyedLogger
 */
export abstract class AbstractKeyedLogger {
    static init: () => void;
    static extractServerMessages: (key: string) => void;
    static error: (message: string, key?: string, error?: Error) => void;
    static warn: (message: string, key?: string, error?: Error) => void;
    static info: (message: string) => void;
    static log: (message: string) => void;
}
