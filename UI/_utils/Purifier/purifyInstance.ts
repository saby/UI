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

function addToQueue(instance: TInstance, instanceName: string, stateNamesNoPurify?: Record<string, boolean>): void {
    queue.push([instance, instanceName, stateNamesNoPurify, Date.now()]);
    if (!isQueueStarted) {
        isQueueStarted = true;
        setTimeout(releaseQueue, asyncPurifyTimeout);
    }
}

const commonDefineProfertyAttributes = {
    enumerable: false,
    configurable: false,
    get: function useAfterPurify(): TProxy {
        error('Какой-то разрушенный контрол пытается обратиться к своему полю. В режиме отладки можно увидеть больше информации');
        return proxy;
    }
};

function createUseAfterPurifyErrorFunction(stateName: string, instanceName: string): () => TProxy {
    return function useAfterPurify(): TProxy {
        error('Разрушенный контрол ' + instanceName + ' пытается обратиться к своему полю ' + stateName + '. Чтобы не было утечки памяти, значение было удалено.' +
            'Проверьте перед этим обращением, разрушен ли контрол, или добейтесь, чтобы этот код вообще не выполнялся после разрушения');
        return proxy;
    };
}

function isValueToPurify(stateValue: TInstanceValue): boolean {
    return !!stateValue && typesToPurify.indexOf(typeof stateValue) !== -1;
}

function purifyState(instance: TInstance, stateName: string, instanceName: string, isDebug: boolean): void {
    const defineProfertyAttributes = isDebug ? {
        enumerable: false,
        configurable: false,
        get: createUseAfterPurifyErrorFunction(stateName, instanceName)
    } : commonDefineProfertyAttributes;
    Object.defineProperty(instance, stateName, defineProfertyAttributes);
}

function purifyInstanceSync(
    instance: TInstance,
    instanceName: string,
    stateNamesNoPurify?: Record<string, boolean>
): void {
    if (instance.__purified) {
        return;
    }

    const isDebug: boolean = needLog();
    const instanceStateNamesToPurify = Object.keys(instance).filter(function filterKeysToPurify(stateName: string) : boolean {
        return  !(stateNamesNoPurify && stateNamesNoPurify[stateName]) && isValueToPurify(instance[stateName]);
    });
    for (let i = 0; i < instanceStateNamesToPurify.length; i++) {
        purifyState(instance, instanceStateNamesToPurify[i], instanceName, isDebug);
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
    if (async) {
        addToQueue(instance, instanceName, stateNamesNoPurify);
    } else {
        purifyInstanceSync(instance, instanceName, stateNamesNoPurify);
    }
}
