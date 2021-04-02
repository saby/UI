/**
 * @author Кондаков Р.Н.
 */

import { error } from '../Logger';
import needLog from './needLog';

type TInstanceValue = any;
type TInstance = Record<string, TInstanceValue>;
type TQueueElement = [TInstance, string, Record<string, boolean>, number];
type TProxy = typeof Proxy | (() => void);

// TODO: по задаче
// https://online.sbis.ru/opendoc.html?guid=ce4797b1-bebb-484f-906b-e9acc5161c7b
const asyncPurifyTimeout = 10000;

const typesToPurify: string[] = ['object', 'function'];
const queue: TQueueElement[] = [];
let isQueueStarted: boolean = false;

// Сделаем безопасными обращения вида instance.one.two.funс().three даже после очистки.
const proxy: TProxy = typeof Proxy !== 'undefined' ? new Proxy(() => {}, {
    get: (target, propName, self) => {
       return self;
    }, set: () => {
       return false;
    }, apply: (target, self) => {
       return self;
    }
 }) : () => {};

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

function addToQueue(instance: TInstance, instanceName: string, stateNamesNoPurify?: Record<string, boolean>): void {
    queue.push([instance, instanceName, stateNamesNoPurify, Date.now()]);
    if (!isQueueStarted) {
        isQueueStarted = true;
        setTimeout(releaseQueue, asyncPurifyTimeout);
    }
}

const commonDefinePropertyAttributes = {
    enumerable: false,
    configurable: false,
    get: function useAfterPurify(): TProxy {
        return proxy;
    }
};

function createUseAfterPurifyErrorFunction(stateName: string, instanceName: string): () => TProxy {
    return function useAfterPurify(): TProxy {
        error('Разрушенный контрол ' + instanceName + ' пытается обратиться к своему полю ' + stateName + '. Для предотвращения утечки памяти значение было удалено.' +
            'Избегайте использования полей контрола после его дестроя, дестрой должен быть последней операцией над контролом.');
        return proxy;
    };
}

function isValueToPurify(stateValue: TInstanceValue): boolean {
    return !!stateValue && typesToPurify.indexOf(typeof stateValue) !== -1;
}

function purifyState(instance: TInstance, stateName: string, instanceName: string, isTestStand: boolean): void {
    if (isTestStand) {
        const useAfterPurifyErrorFunction = createUseAfterPurifyErrorFunction(stateName, instanceName);
        Object.defineProperty(instance, stateName, {
            enumerable: false,
            configurable: false,
            get: useAfterPurifyErrorFunction,
            set: useAfterPurifyErrorFunction
        });
        return;
    }
    try {
        // Быстрее всего просто присвоить.
        instance[stateName] = proxy;
    } catch {
        // Может быть только getter, тогда приходится использовать defineProperty. Редкий случай.
        Object.defineProperty(instance, stateName, commonDefinePropertyAttributes);
    }
}

function purifyInstanceSync(
    instance: TInstance,
    instanceName: string,
    stateNamesNoPurify?: Record<string, boolean>
): void {
    if (instance.__purified) {
        return;
    }

    const isTestStand: boolean = needLog();
    const instanceStateNamesToPurify = Object.keys(instance).filter(function filterKeysToPurify(stateName: string) : boolean {
        return  !(stateNamesNoPurify && stateNamesNoPurify[stateName]) && isValueToPurify(instance[stateName]);
    });
    for (let i = 0; i < instanceStateNamesToPurify.length; i++) {
        purifyState(instance, instanceStateNamesToPurify[i], instanceName, isTestStand);
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
 * @class UICore/_utils/Purifier/purifyInstance
 * @author Кондаков Р.Н.
 */
export default function purifyInstance(
    instance: TInstance,
    instanceName: string = 'instance',
    async: boolean = false,
    stateNamesNoPurify?: Record<string, boolean>
): void {
    if (async) {
        addToQueue(instance, instanceName, stateNamesNoPurify);
    } else {
        purifyInstanceSync(instance, instanceName, stateNamesNoPurify);
    }
}
