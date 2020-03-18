import * as Logger from '../Logger';
import { delay } from 'Types/function';
import { factory, Abstract } from 'Types/chain'

// TODO: по задаче
// https://online.sbis.ru/opendoc.html?guid=ce4797b1-bebb-484f-906b-e9acc5161c7b
const asyncPurifyTimeout = 10000;

const typesToPurify: string[] = ['object', 'function'];

function createUseAfterPurifyErrorFunction(stateName: string, instanceName: string): () => void {
    return function useAfterPurify() {
        // TODO: по задаче
        // https://online.sbis.ru/opendoc.html?guid=ce4797b1-bebb-484f-906b-e9acc5161c7b
        Logger.warn(`Попытка получить поле ${stateName} в очищенном ${instanceName}`);
    };
}

function emptyFunction() {}

function isValueToPurify(stateValue: any): boolean {
    return !!(stateValue && ~typesToPurify.indexOf(typeof stateValue));
}

function collectAllEntries(instance: Record<string, any>): [string, any][] {
    let instanceKeys: Abstract<string> = factory([]);
    let subInstance: Record<string, any> = instance;
    while(subInstance) {
        instanceKeys = instanceKeys.union(Object.keys(subInstance));
        subInstance = Object.getPrototypeOf(subInstance);
    }
    return instanceKeys.value().map((instanceKey) => [instanceKey, instance[instanceKey]] as [string, any]);
}

function purifyInstanceSync(instance: Record<string, any>, instanceName: string, stateNamesNoPurify: Record<string, boolean> = {}) {
    if (instance.__purified) {
        return;
    }

    const instanceEntries = collectAllEntries(instance);
    while (instanceEntries.length) {
        const [stateName, stateValue] = instanceEntries.pop();

        const getterFunction = isValueToPurify(stateValue) && !stateNamesNoPurify[stateName] ?
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
    }

    Object.defineProperty(instance, '__purified', {
        enumerable: false,
        configurable: false,
        get: () => true
    });
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
        setTimeout(() => {
            // Чтобы не копилась очередь таймаутов, блокирующая перерисовку, нужен delay.
            delay(() => {
                purifyInstanceSync(instance, instanceName, stateNamesNoPurify);
            });
        }, asyncPurifyTimeout);
    } else {
        purifyInstanceSync(instance, instanceName, stateNamesNoPurify);
    }
};
