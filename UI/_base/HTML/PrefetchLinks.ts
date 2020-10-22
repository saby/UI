import * as AppEnv from "Application/Env";
import {Head as AppHead} from "Application/_Page/Head";
import * as ModulesLoader from "UI/_utils/ModulesLoader";
import {constants, IoC} from "Env/Env";
import {headDataStore} from "UI/_base/HeadData";


/**
 * Класс для добавления модулей для prefetch|preload на клиенте
 */
class PrefetchLinksStore {
    addPrefetchModules(modules: string[]) {
        _addModulesToApi(modules, { prefetch: true});
    }

    addPreloadModules(modules: string[]) {
        _addModulesToApi(modules, { preload: true});
    }
}

/**
 * Класс для работы со стором хранящим список модулей для prefetch|preload на страницу
 * Используется только на СП
 */
class PrefetchLinksStorePS extends PrefetchLinksStore {
    private _storeName: string = 'prefetchLinksStore';
    private _prefetchField: string = 'prefetchModules';
    private _preloadField: string = 'preloadModules';

    /** Создание инстанса стора */
    private _createStore() {
        return new Store();
    }

    private _store() {
        return AppEnv.getStore(this._storeName, this._createStore);
    }

    private _addModules(key: string, modules: string[]) {
        this._store().set(key, [...this._getModules(key), ...modules]);
    }

    private _getModules(key: string): string[] {
        return this._store().get(key) as string[] || [];
    }

    addPrefetchModules(modules: string[]) {
        this._addModules(this._prefetchField, modules);
    }

    getPrefetchModules(): string[] {
        return this._getModules(this._prefetchField);
    }

    addPreloadModules(modules: string[]) {
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
 * @param jsModules
 */
export function handlePrefetchModules(jsModules: string[]): void {
    if (!constants.isServerSide) {
        return
    }

    const pls = new PrefetchLinksStorePS();

    const prefetchModules: string[] = pls.getPrefetchModules();
    if (prefetchModules && prefetchModules.length) {
        const modules = _getModuleDeps(prefetchModules)
            .filter((_mod) => jsModules.indexOf(_mod) === -1);

        _addModulesToApi(modules, {prefetch: true});
    }

    const preloadModules: string[] = pls.getPreloadModules();
    if (preloadModules && preloadModules.length) {
        const modules = _getModuleDeps(preloadModules)
            .filter((_mod) => jsModules.indexOf(_mod) === -1);

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
    var API = AppHead.getInstance();
    modules.forEach(function(moduleName) {
        var path = ModulesLoader.getModuleUrl(moduleName);
        path = path.indexOf('/') !== 0 ? '/' + path : path;
        var _type = _getTypeString(path);
        if (!_type) {
            IoC.resolve('ILogger').warn('[Controls/Application.js] Для файла ' + path + ' не удалось получить строку-тип');
            return;
        }

        var rel = cfg.prefetch ? 'prefetch' : 'preload';
        API.createTag('link', { rel: rel, as: _type, href: path });
    });
}

/**
 * Получить список всех зависимостей указанных модулей
 * Работает только на СП
 * @param modules
 * @private
 */
function _getModuleDeps(modules) {
    var dependencies = headDataStore.read('pageDeps').collect(modules);
    return dependencies.js;
}

/**
 * Получить строку-тип ресурса по его расширению
 * @param path
 * @private
 */
function _getTypeString(path) {
    var types = {
        'script': new RegExp('\.js'),
        'fetch': new RegExp('\.wml'),
        'style': new RegExp('\.css')
    };
    for (var _type in types) {
        if (types.hasOwnProperty(_type) && types[_type].test(path)) {
            return _type;
        }
    }
    return null;
}
