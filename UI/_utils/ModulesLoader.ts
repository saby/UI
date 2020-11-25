/**
 * A modules loader on application level
 * @author Мальцев А.А.
 */
import { getModuleUrl as getModuleUrlBase, ModulesManager } from 'RequireJsLoader/conduct';
import * as library from './Library';

interface IParsedName {
    name: string;
    path: string[];
}

let cache: Record<string, Promise<unknown>> = {};

let modulesManager: ModulesManager;

function getModulesManager(): ModulesManager {
    if (!modulesManager) {
        modulesManager = new ModulesManager(requirejs);
    }
    return modulesManager;
}

function getFromLib<T>(lib: T, parsedName: IParsedName): T {
    const mod = library.extract<T>(lib, parsedName);
    if (mod instanceof Error) {
        throw new Error(mod.message);
    }
    return mod as T;
}

function isCached(name: string): boolean {
    return !!cache[name];
}

/**
 * Возвращает признак, что модуль загружен
 * @param name Имя модуля в обычном (Foo/bar) или библиотечном (Foo/bar:baz) синтаксисе
 * @protected
 */
export function isLoaded(name: string): boolean {
    const parsedInfo: IParsedName = library.parse(name);
    return getModulesManager().isLoaded(parsedInfo.name);
}

/**
 * Возвращает URL местоположения модуля
 * @param name Имя модуля в обычном (Foo/bar) или библиотечном (Foo/bar:baz) синтаксисе
 * @protected
 */
export function getModuleUrl(name: string): string {
    const parsedInfo: IParsedName = library.parse(name);
    return getModuleUrlBase(parsedInfo.name);
}

/**
 * Асинхронно загружает модуль
 * @param name Имя модуля в обычном (Foo/bar) или библиотечном (Foo/bar:baz) синтаксисе
 * @protected
 */
export function loadAsync<T>(name: string): Promise<T> {
    if (isLoaded(name)) {
        return new Promise((resolve) => {
            resolve(loadSync(name));
        });
    }

    const parsedInfo: IParsedName = library.parse(name);
    const loadFromModule = (res) => getFromLib(res, parsedInfo);

    if (isCached(parsedInfo.name)) {
        return cache[parsedInfo.name].then(loadFromModule) as Promise<T>;
    }

    let promiseResult = getModulesManager()
        .load<[T]>([parsedInfo.name])
        .then(([moduleBody]) => moduleBody);

    cache[parsedInfo.name] = promiseResult = promiseResult.then((res) => {
        delete cache[parsedInfo.name];
        return res;
    }, (error) => {
        delete cache[parsedInfo.name];
        throw error;
    });

    return promiseResult.then(loadFromModule) as Promise<T>;
}

/**
 * Возвращает загруженный модуль
 * @param name Имя модуля в обычном (Foo/bar) или библиотечном (Foo/bar:baz) синтаксисе
 * @protected
 */
export function loadSync<T>(name: string): T {
    const parsedInfo = library.parse(name);
    const module = getModulesManager().loadSync<T>(parsedInfo.name);
    return getFromLib(module, parsedInfo);

}

/**
 * Синхронно выгружает модуль
 * @param module Имя модуля в обычном (Foo/bar) или библиотечном (Foo/bar:baz) синтаксисе
 * @protected
 */
export function unloadSync(module: string): void {
    const parsedInfo: IParsedName = library.parse(module);
    getModulesManager().unloadSync(parsedInfo.name);
}

export function clearCache(): void {
    cache = {};
}
