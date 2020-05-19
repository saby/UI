import { warn } from '../Logger';
import needLog from './needLog';

// TODO: по задаче
// https://online.sbis.ru/opendoc.html?guid=ce4797b1-bebb-484f-906b-e9acc5161c7b
const asyncPurifyTimeout = 10000;

const typesToPurify: string[] = ['object', 'function'];

const queue: [Record<string, any>, string, Record<string, boolean>, number][] = [];
let isQueueStarted: boolean = false;

function releaseQueue(): void {
    const currentTimestamp: number = Date.now();
    while (queue.length) {
        const [instance, instanceName, stateNamesNoPurify, timestamp] = queue[0];
        if (currentTimestamp - timestamp < asyncPurifyTimeout) {
            setTimeout(releaseQueue, asyncPurifyTimeout);
            return;
        }
        queue.shift();
        purifyInstanceSync(instance, instanceName, stateNamesNoPurify);
    }
    isQueueStarted = false;
}

function addToQueue(instance: Record<string, any>, instanceName: string, stateNamesNoPurify: Record<string, boolean> = {}): void {
    queue.push([instance, instanceName, stateNamesNoPurify, Date.now()]);
    if (!isQueueStarted) {
        isQueueStarted = true;
        setTimeout(releaseQueue, asyncPurifyTimeout);
    }
}

function createUseAfterPurifyErrorFunction(stateName: string, instanceName: string): () => void {
    return function useAfterPurify() {
        // TODO: по задаче
        // https://online.sbis.ru/opendoc.html?guid=ce4797b1-bebb-484f-906b-e9acc5161c7b
        warn(`Попытка получить поле ${stateName} в очищенном ${instanceName}`);
    };
}

function emptyFunction() {}

function isValueToPurify(stateValue: any): boolean {
    return !!(stateValue && ~typesToPurify.indexOf(typeof stateValue));
}

function purifyInstanceSync(instance: Record<string, any>, instanceName: string, stateNamesNoPurify: Record<string, boolean> = {}) {
    if (instance.__purified) {
        return;
    }

    const isDebug = needLog();

    // @ts-ignore У нас подмешивается полифилл Object.entries, о котором не знает ts
    const instanceEntries = Object.entries(instance);
    while (instanceEntries.length) {
        const [stateName, stateValue] = instanceEntries.pop();

        const haveToPurify = isValueToPurify(stateValue) && !stateNamesNoPurify[stateName];

        if (isDebug) {
            const getterFunction = haveToPurify ?
                createUseAfterPurifyErrorFunction(stateName, instanceName) :
                () => stateValue;

            // TODO: убрать костыль в https://online.sbis.ru/opendoc.html?guid=1c91dd41-5adf-4fd7-b2a4-ff8f103a8084
            // возможно, нужно не удалять объекты и функции, а заменять на пустые функции и объекты соответственно
            Object.defineProperty(instance, stateName, {
                enumerable: false,
                configurable: false,
                set: emptyFunction,
                get: stateName === 'destroy' ? () => emptyFunction : getterFunction
            });
        } else {
            if (haveToPurify) {
                if (stateName === 'destroy') {
                    instance[stateName] = emptyFunction;
                } else {
                    try {
                        instance[stateName] = undefined;
                    } catch (e) {
                        // Может быть только getter, не переприсвоить.
                        delete instance[stateName];
                    }
                }
            }
        }
    }

    if (isDebug) {
        Object.defineProperty(instance, '__purified', {
            enumerable: false,
            configurable: false,
            get: () => true
        });
    } else {
        instance.__purified = true;
    }
    Object.freeze(instance);
}

/**
 * Функция, очищающая экземпляр от объектов и фунций. Генерирует предупреждение при попытке обратиться к ним.
 * Также замораживает экземпляр, тем самым убирая возможность записать или перезаписать поле любого типа.
 * @param {Record<string, any>} instance - экземпляр, поля которого нужно очистить.
 * @param {string} [instanceName = 'instance'] - имя экземпляра для отображения в предупреждении.
 * @param {boolean} [async = false] - вызывать ли очистку с задержкой.
 * @param {Record<string, boolean>} [stateNamesNoPurify?] - объект с именами полей, которые чистить не нужно.
 * @class UI/_utils/Purifier/purifyInstance
 * @author Кондаков Р.Н.
 */
export default function purifyInstance(instance: Record<string, any>,
                                       instanceName: string = 'instance',
                                       async: boolean = false,
                                       stateNamesNoPurify?: Record<string, boolean>): void {
    if (async) {
        purifyInstanceSync(instance, instanceName, stateNamesNoPurify);
    } else {
        purifyInstanceSync(instance, instanceName, stateNamesNoPurify);
    }
};
