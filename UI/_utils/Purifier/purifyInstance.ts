import * as Logger from '../Logger';

const asyncPurifyTimeout = 6000;

const typesToPurify: string[] = ['object', 'function'];

function createUseAfterDestroyErrorFunction(stateName: string, instanceName: string): () => void {
    return () => {
        Logger.error(`Trying to get the ${stateName} out of the purified ${instanceName}`);
    };
}

function emptyFunction() {}

function needErrorOnGet(stateValue: any): boolean {
    return !!(stateValue && ~typesToPurify.indexOf(typeof stateValue));
}

function purifyInstanceSync(instance: Record<string, any>, instanceName: string) {
    for (let stateName in instance) {
        if (!instance.hasOwnProperty(stateName)) {
            continue;
        }

        const stateValue = instance[stateName];

        const getterFunction = needErrorOnGet(stateValue) ?
            createUseAfterDestroyErrorFunction(stateName, instanceName) :
            () => stateValue;

        Object.defineProperty(instance, stateName, {
            enumerable: false,
            configurable: false,
            set: emptyFunction,
            get: getterFunction
        });
    }
    Object.freeze(instance);
}

/**
 * Функция, очищающая экземпляр от объектов и фунций. Генерирует ошибку при попытке обратиться к ним.
 * Также замораживает экземпляр, тем самым убирая возможность записать или перезаписать поле любого типа.
 * @param {Record<string, any>} instance - экземпляр, поля которого нужно очистить.
 * @param {string} [instanceName = 'instance'] - имя экземпляра для отображения в ошибке.
 * @param {boolean} [async = false] - вызывать ли очистку с задержкой.
 * @class UI/_utils/Purifier/purifyInstance
 * @author Кондаков Р.Н.
 */
export default function purifyInstance(instance: Record<string, any>, instanceName: string = 'instance', async: boolean = false): void {
    if (async) {
        setTimeout(purifyInstanceSync, asyncPurifyTimeout, instance, instanceName);
    } else {
        purifyInstanceSync(instance, instanceName);
    }
};
