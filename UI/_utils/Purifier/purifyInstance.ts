import * as Logger from '../Logger';
// TODO: по задаче
// https://online.sbis.ru/opendoc.html?guid=ce4797b1-bebb-484f-906b-e9acc5161c7b
const asyncPurifyTimeout = 10000;

const typesToPurify: string[] = ['object', 'function'];

function createUseAfterDestroyErrorFunction(stateName: string, instanceName: string): () => void {
    return () => {
        // TODO: по задаче
        // https://online.sbis.ru/opendoc.html?guid=ce4797b1-bebb-484f-906b-e9acc5161c7b
        Logger.warn(`Попытка получить поле ${stateName} в очищенном ${instanceName}`);
    };
}

function emptyFunction() {}

function isValueToPurify(stateValue: any): boolean {
    return !!(stateValue && ~typesToPurify.indexOf(typeof stateValue));
}

function purifyInstanceSync(instance: Record<string, any>, instanceName: string) {
    // @ts-ignore: есть полифилл для Object.entries, информации о котором нет у компиллятора ts.
    const instanceEntries = Object.entries(instance);
    while (instanceEntries.length) {
        const [stateName, stateValue] = instanceEntries.pop();

        // TODO: Удалить исключение для поля _children после решения ошибки по ссылке ниже.
        // https://online.sbis.ru/opendoc.html?guid=095a1b4d-77e9-49fb-96ec-cf4aa6372e2b
        if (stateName === '_children') {
            continue;
        }

        const getterFunction = isValueToPurify(stateValue) ?
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
