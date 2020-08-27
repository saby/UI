/**
 * @author Кондаков Р.Н.
 */

import { error } from '../Logger';
import { default as needLog, needPurify } from './needLog';

type TInstanceValue = any;
type TInstance = Record<string, TInstanceValue>;
type TQueueElement = [TInstance, string, Record<string, boolean>, number];

// TODO: по задаче
// https://online.sbis.ru/opendoc.html?guid=ce4797b1-bebb-484f-906b-e9acc5161c7b
const asyncPurifyTimeout = 10000;

const typesToPurify: string[] = ['object', 'function'];
const queue: TQueueElement[] = [];
let isQueueStarted: boolean = false;

function releaseQueue(): void {
    const currentTimestamp: number = Date.now();
    while (queue.length) {
        const [instance, instanceName, stateNamesNoPurify, timestamp]: TQueueElement = queue[0];
        if (currentTimestamp - timestamp < asyncPurifyTimeout) {
            setTimeout(releaseQueue, asyncPurifyTimeout);
            return;
        }
        queue.shift();
        purifyInstanceSync(instance, instanceName, stateNamesNoPurify);
    }
    isQueueStarted = false;
}

function addToQueue(instance: TInstance, instanceName: string, stateNamesNoPurify: Record<string, boolean> = {}): void {
    queue.push([instance, instanceName, stateNamesNoPurify, Date.now()]);
    if (!isQueueStarted) {
        isQueueStarted = true;
        setTimeout(releaseQueue, asyncPurifyTimeout);
    }
}

function createUseAfterPurifyErrorFunction(stateName: string, instanceName: string): () => void {
    return function useAfterPurify(): void {
        // TODO: по задаче
        // https://online.sbis.ru/opendoc.html?guid=ce4797b1-bebb-484f-906b-e9acc5161c7b
        error('Попытка получить поле ' + stateName + ' в очищенном ' + instanceName);
    };
}

function emptyFunction() {}

function isValueToPurify(stateValue: TInstanceValue): boolean {
    return !!stateValue && typesToPurify.indexOf(typeof stateValue) !== -1;
}

function purifyState(instance: TInstance, stateName: string, getterFunction: () => void, isDebug: boolean): void {
    if (stateName === 'destroy') {
        // TODO: убрать костыль в https://online.sbis.ru/opendoc.html?guid=1c91dd41-5adf-4fd7-b2a4-ff8f103a8084
        instance.destroy = emptyFunction;
        return;
    }
    if (isDebug) {
        Object.defineProperty(instance, stateName, {
            enumerable: false,
            configurable: false,
            get: getterFunction
        });
        return;
    }
    try {
        instance[stateName] = undefined;
    } catch (e) {
        // Может быть только getter, не переприсвоить.
        delete instance[stateName];
    }
}

function exploreAfterDestroyState(instance: TInstance, stateName: string, instanceName: string, value: any) {
    const errorF = createUseAfterPurifyErrorFunction(stateName, instanceName);
    let currentValue = value;
    Object.defineProperty(instance, stateName, {
        enumerable: false,
        configurable: false,
        get: () => {
            errorF();
            return currentValue;
        },
        set: (v) => {
            errorF();
            currentValue = v;
        }
    });
}

function purifyInstanceSync(
    instance: TInstance,
    instanceName: string,
    stateNamesNoPurify: Record<string, boolean> = {}
): void {
    if (instance.__purified) {
        return;
    }

    const isDebug = needLog();

    // @ts-ignore У нас подмешивается полифилл Object.entries, о котором не знает ts
    const instanceEntries = Object.entries(instance);
    for (let i = 0; i < instanceEntries.length; i++) {
        const [stateName, stateValue]: [string, TInstanceValue] = instanceEntries[i];

        exploreAfterDestroyState(instance, stateName, instanceName, stateValue);
    }

    instance.__purified = true;
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
export default function purifyInstance(
    instance: TInstance,
    instanceName: string = 'instance',
    async: boolean = false,
    stateNamesNoPurify?: Record<string, boolean>
): void {
    if (!needPurify()) {
        return;
    }
    if (async) {
        addToQueue(instance, instanceName, stateNamesNoPurify);
    } else {
        purifyInstanceSync(instance, instanceName, stateNamesNoPurify);
    }
}
