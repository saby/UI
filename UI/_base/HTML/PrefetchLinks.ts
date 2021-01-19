import * as AppEnv from 'Application/Env';
import { Head as AppHead } from 'Application/Page';
import * as ModulesLoader from 'WasabyLoader/ModulesLoader';
import { constants } from 'Env/Env';
import { headDataStore } from 'UI/_base/HeadData';
import { logger } from 'Application/Env';

interface IPrefetchLinks {
    addPrefetchModules(modules: string[]): void;
    addPreloadModules(modules: string[]): void;
}

/**
 * Класс для добавления модулей для prefetch|preload на клиенте
 */
export class PrefetchLinksStore implements IPrefetchLinks {
    addPrefetchModules(modules: string[]): void {
        _addModulesToApi(modules, { prefetch: true});
    }

    addPreloadModules(modules: string[]): void {
        _addModulesToApi(modules, { preload: true});
    }
}

/**
 * Класс для работы со стором хранящим список модулей для prefetch|preload на страницу
 * Используется только на СП
 */
export class PrefetchLinksStorePS implements IPrefetchLinks {
    private _storeName: string = 'prefetchLinksStore';
    private _prefetchField: string = 'prefetchModules';
    private _preloadField: string = 'preloadModules';

    /** Создание инстанса стора */
    private _createStore<T>(): Store<T> {
        return new Store<T>();
    }

    private _store<T>(): Store<T> {
        return AppEnv.getStore(this._storeName, this._createStore) as Store<T>;
    }

    private _addModules(key: string, modules: string[]): void {
        this._store().set(key, [...this._getModules(key), ...modules]);
    }

    private _getModules(key: string): string[] {
        return this._store().get(key) as string[] || [];
    }

    /**
     * Очистка стора для unit-тестов
     */
    clear(): void {
        this._store().set(this._prefetchField, []);
        this._store().set(this._preloadField, []);
    }

    addPrefetchModules(modules: string[]): void {
        this._addModules(this._prefetchField, modules);
    }

    getPrefetchModules(): string[] {
        return this._getModules(this._prefetchField);
    }

    addPreloadModules(modules: string[]): void {
        this._addModules(this._preloadField, modules);
    }

    getPreloadModules(): string[] {
        return this._getModules(this._preloadField);
    }
}

export default constants.isServerSide ? PrefetchLinksStorePS : PrefetchLinksStore;

class Store<T> {
    private readonly _store: Record<string, T> = {};
    get(key: string): T {
        return this._store[key];
    }
    set(key: string, value: T): boolean {
        this._store[key] = value;
        return true;
    }
    remove(key: string): void {
        delete this._store[key];
    }
    getKeys(): string[] {
        return Object.keys(this._store);
    }

    toObject(): Record<string, T> {
        return {...this._store};
    }
}

/**
 * Добавляет модули в prefetch/preload предварительно найдя все зависимости и отбросив зависимости страницы
 * Работает только на СП
 * @param pageModules список названий модулей, которые будут загружены на странице.
 *                    из списка модулей для prefetch удалим те, которые уже есть в pageModules
 */
export function handlePrefetchModules(pageModules: string[]): void {
    if (!constants.isServerSide) {
        return;
    }

    const pls = new PrefetchLinksStorePS();

    const prefetchModules: string[] = pls.getPrefetchModules();
    if (prefetchModules && prefetchModules.length) {
        const modules = _getModuleDeps(prefetchModules)
            .filter((_mod) => pageModules.indexOf(_mod) === -1);

        _addModulesToApi(modules, {prefetch: true});
    }

    const preloadModules: string[] = pls.getPreloadModules();
    if (preloadModules && preloadModules.length) {
        const modules = _getModuleDeps(preloadModules)
            .filter((_mod) => pageModules.indexOf(_mod) === -1);

        _addModulesToApi(modules, {prefetch: true});
    }
}

interface IPrefetchModules {
    prefetch?: boolean;
    preload?: boolean;
}

/**
 * Добавляет модули в API HEAD предварительно вычислив их путь до файла
 * @param modules
 * @param cfg
 */
function _addModulesToApi(modules: string[], cfg: IPrefetchModules): void {
    const API = AppHead.getInstance();
    modules.forEach((moduleName) => {
        let path: string = ModulesLoader.getModuleUrl(moduleName);
        path = path.indexOf('/') !== 0 ? '/' + path : path;
        const _type: string = _getTypeString(path);
        if (!_type) {
            logger.warn('[Controls/Application.js] Для файла ' + path + ' не удалось получить строку-тип');
            return;
        }

        const rel: string = cfg.prefetch ? 'prefetch' : 'preload';
        API.createTag('link', { rel, as: _type, href: path });
    });
}

/**
 * Получить список всех зависимостей указанных модулей
 * Работает только на СП
 * @param modules
 * @private
 */
function _getModuleDeps(modules: string[]): string[] {
    const dependencies = headDataStore.read('pageDeps').collect(modules, []);
    return dependencies.js;
}

/**
 * Получить строку-тип ресурса по его расширению
 * @param path
 * @private
 */
function _getTypeString(path: string): string | null {
    const types = {
        script: new RegExp('\.js'),
        fetch: new RegExp('\.wml'),
        style: new RegExp('\.css')
    };
    for (const _type in types) {
        if (types.hasOwnProperty(_type) && types[_type].test(path)) {
            return _type;
        }
    }
    return null;
}
