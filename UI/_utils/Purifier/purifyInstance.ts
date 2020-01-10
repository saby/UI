import * as Logger from '../Logger';

const asyncPurifyTimeout = 3000;

const typesToPurify: string[] = ['object', 'function'];

function createUseAfterDestroyErrorFunction(stateName: string, instanceName: string) {
    return () => {
        Logger.error(`Trying to use ${stateName} in purified ${instanceName}`);
    };
}

function needErrorOnGet(stateValue: any): boolean {
    return !!(stateValue && ~typesToPurify.indexOf(typeof stateValue));
}

function purifyInstanceSync(instance: Record<string, any>, instanceName: string) {
    for (let stateName in instance) {
        if (!instance.hasOwnProperty(stateName)) {
            continue;
        }

        const stateValue = instance[stateName];

        const errorFunction = createUseAfterDestroyErrorFunction(stateName, instanceName);
        const getterFunction = needErrorOnGet(stateValue) ? errorFunction : () => stateValue;

        Object.defineProperty(instance, stateName, {
            enumerable: false,
            configurable: false,
            set: errorFunction,
            get: getterFunction
        });
    }
    Object.freeze(instance);
}

/**
 * Функция, очищающая экземпляр от объектов и фунций. Генерирует ошибку при обращении после очистки.
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
