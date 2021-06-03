import { logger, getStateReceiver } from 'Application/Env';
import { isInit as isInitApplication } from 'Application/Initializer';
import { constants } from 'Env/Env';
import {
    TMessageType,
    TKeyedMessages,
    TSerializableMessages,
    ILoggerStateReceiverComponent,
    AbstractKeyedLogger
} from './interfaces';
import { CustomError } from './CustomError';

const messageTypes: TMessageType[] = ['error', 'warn', 'info', 'log'];
const loggerMeta = {
    ulid: 'KeyedLogger',
    moduleName: 'UICore/Logger:KeyedLogger'
};
const messageAndStackSeparator = '_message_and_stack_separator_';
const waitTime: number = 60000;

export class KeyedLogger extends AbstractKeyedLogger {
    private static isInit: boolean = false;
    private static serverMessages: TSerializableMessages = {};
    private static isWaitTimeGone: boolean = false;

    static init(): void {
        // TODO: вероятно, все FIXME из-за этого. Для каждого заспроса нужно звать свой init. Хранить в request?
        if (this.isInit || !isInitApplication()) {
            return;
        }
        const stateReceiver = getStateReceiver();
        if (!stateReceiver || !stateReceiver.register) {
            return;
        }
        this.isInit = true;

        // FIXME: сообщения в setState при register прилетяют только первую загрузку после старта сервера
        stateReceiver.register(loggerMeta, this.getStateReceiverComponent());

        if (constants.isBrowserPlatform) {
            // При регистрации на клиенте сообщения сохранятся в этом классе, незачем оставлять их в stateReceiver.
            stateReceiver.unregister(loggerMeta.ulid);
            setTimeout(() => {
                this.isWaitTimeGone = true;
                this.extractRemainingServerMessages();
            }, waitTime);
        }
    }

    static extractServerMessages(key: string): void {
        if (constants.isServerSide) {
            return;
        }
        const savedMessages: TKeyedMessages = this.serverMessages[key];
        if (!savedMessages) {
            return;
        }
        delete this.serverMessages[key];

        const preffixMessage: string = this.createExtractServerMessagePreffix(key);

        messageTypes.forEach((messageType: TMessageType): void => {
            const messagesOfCurrentType: string[] = savedMessages[messageType];
            for (let i = 0; i < messagesOfCurrentType.length; i++) {
                const separatedMessage = messagesOfCurrentType[i].split(messageAndStackSeparator);
                logger[messageType](preffixMessage + separatedMessage[0], separatedMessage[1], '');
            }
        });
    }

    static error(message: string, key?: string, error?: Error): void {
        if (constants.isBrowserPlatform) {
            logger.error(message, new CustomError('ClientError', error));
            return;
        }
        const serverError: CustomError = new CustomError('ServerError', error);
        if (key) {
            const keyedMessages = this.getKeyedMessages(key);

            // FIXME: Бесконечно копятся каждую перезагрузку
            keyedMessages.error.push(message + serverError.message + messageAndStackSeparator + serverError.stack);
        }
        logger.error(message, serverError);
    }

    static warn(message: string, key?: string, error?: Error): void {
        if (constants.isBrowserPlatform) {
            logger.warn(message, new CustomError('ClientWarning', error));
            return;
        }
        const ServerWarning: CustomError = new CustomError('ServerWarning', error);
        if (key) {
            const keyedMessages = this.getKeyedMessages(key);

            // FIXME: Бесконечно копятся каждую перезагрузку
            keyedMessages.warn.push(message + ServerWarning.message + messageAndStackSeparator + ServerWarning.stack);
        }
        logger.warn(message, ServerWarning);
    }

    static info(message: string): void {
        logger.info(message);
    }

    static log(message: string): void {
        logger.log(message);
    }

    private static getStateReceiverComponent(): ILoggerStateReceiverComponent {
        return {
            getState: () => {
                if (constants.isServerSide) {
                    return this.serverMessages;
                }
            },
            setState: (serverState: TSerializableMessages) => {
                if (constants.isBrowserPlatform) {
                    this.serverMessages = serverState;
                }
            }
        };
    }

    private static getKeyedMessages(key: string): TKeyedMessages {
        if (!this.serverMessages[key]) {
            this.serverMessages[key] = {
                error: [],
                warn: [],
                info: [],
                log: []
            };
        }
        return this.serverMessages[key];
    }

    private static extractRemainingServerMessages(): void {
        const keys: string[] = Object.keys(this.serverMessages);
        for (let i = 0; i < keys.length; i++) {
            this.extractServerMessages(keys[i]);
        }
    }

    private static createExtractServerMessagePreffix(key: string): string {
        if (!this.isWaitTimeGone) {
            return '';
        }
        return 'Компонент с ключом ' + key + ' не извлёк свои серверные сообщения за ' + waitTime + 'ms\n';
    }
}
