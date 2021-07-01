/// <amd-module name="UICommon/_deps/HeadData" />
import { constants } from 'Env/Env';
import * as Library from 'WasabyLoader/Library';
import { IDeps } from './DepsCollector';
import PageDeps from './PageDeps';
import * as AppEnv from 'Application/Env';
import { IStore } from 'Application/Interface';
/**
 * Компонент-состояние head страницы
 * Собирает ресурсы страницы,
 */
// tslint:disable-next-line:no-any
export default class HeadData implements IStore<Record<keyof HeadData, any>> {
    // переедет в константы реквеста, изменяется в Controls/Application
    isNewEnvironment: boolean = false;
    pageDeps: PageDeps;
    /** Дополнительные модули, для которых следует собрать зависимости */
    private initDeps: Record<string, boolean> = {};
    /** Дополнительные модули, которые следует грузить отложенно */
    private lazyInitDeps: Record<string, boolean> = {};
    private resolve: Function = null;
    // tslint:disable-next-line:no-any
    private renderPromise: Promise<ICollectedDeps> = null;
    /**
     * Непакуемые require-зависимости
     */
    private unpackDeps: IDeps = [];

    /**
     * Уже подключенные через rt-пакеты, статические бандлы ресурсы
     */
    private includedResources: { links: IDeps, scripts: IDeps; } = { links: [], scripts: [] };
    constructor() {
        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.getKeys = this.getKeys.bind(this);
        this.toObject = this.toObject.bind(this);
        this.collectDeps = this.collectDeps.bind(this);
        this.collectDependencies = this.collectDependencies.bind(this);
        this.setUnpackDeps = this.setUnpackDeps.bind(this);
        this.waitAppContent = this.waitAppContent.bind(this);
        this.pushDepComponent = this.pushDepComponent.bind(this);
        this.resetRenderDeferred = this.resetRenderDeferred.bind(this);
        this.setIncludedResources = this.setIncludedResources.bind(this);

        this.pageDeps = new PageDeps();
        this.resetRenderDeferred();
    }

    /* toDO: StateRec.register */
    /**
     * добавить зависимость страницы
     */
    pushDepComponent(componentName: string, lazyLoading: boolean = false): void {
        if (!componentName) {
            return;
        }
        this.initDeps[componentName] = true;
        if (lazyLoading) {
            this.lazyInitDeps[componentName] = true;
        }
    }

    /**
     * Установка непакуемых зависимостей
     * @param unpack
     */
    setUnpackDeps(unpack: IDeps): void {
        this.unpackDeps = unpack;
    }

    /**
     * Установка дополнительных ресурсов
     * @param resources
     */
    setIncludedResources(resources: IResources): void {
        const scripts = resources.scripts.map((l) => l.src);
        const links = resources.links.map((l) => l.href);
        this.includedResources = { links, scripts };
    }

    /**
     * Коллекция зависимостей
     * @param tempLoading
     */
    collectDeps(tempLoading: Promise<void>): void {
        tempLoading.then(() => {
            if (!this.resolve) {
                return;
            }
            this.resolve(this.collectDependencies());
            this.resolve = null;
        });
    }

    collectDependencies(): ICollectedDeps {
        const { additionalDeps, serialized: rsSerialized } = getSerializedData();
        const deps = Object.keys({ ...additionalDeps, ...this.initDeps });
        const files = this.pageDeps.collect(deps, this.unpackDeps);
        // некоторые разработчики завязываются на порядок css, поэтому сначала css переданные через links
        const simpleCss = this.includedResources.links.concat(files.css.simpleCss);
        // TODO нельзя слить ссылки и имена модулей т.к LinkResolver портит готовые ссылки
        // TODO временно прокидываю их раздельно
        return {
            scripts: this.includedResources.scripts, // готовые ссылки на js
            js: files.js, // названия js модулей
            css: { simpleCss, themedCss: files.css.themedCss },
            tmpl: files.tmpl,
            wml: files.wml,
            rsSerialized,
            rtpackModuleNames: this.unpackDeps,
            additionalDeps: deps
        };
    }

    waitAppContent(): Promise<ICollectedDeps> {
        return this.renderPromise;
    }

    resetRenderDeferred(): void {
        this.renderPromise = new Promise((resolve) => {
            this.resolve = resolve;
        });
    }

    // #region IStore
    get<K extends keyof HeadData>(key: K): HeadData[K] {
        return this[key];
    }
    set<K extends keyof HeadData>(key: K, value: this[K]): boolean {
        try {
            this[key] = value;
            return true;
        } catch (_e) {
            return false;
        }
    }
    // tslint:disable-next-line:no-empty
    remove(): void { }
    getKeys(): KeyHeadData[] {
        return Object.keys(this) as KeyHeadData[];
    }
    // tslint:disable-next-line:no-any
    toObject(): Record<keyof HeadData, any> {
        return Object.assign({}, this);
    }
    // #endregion
}

class HeadDataStore {
    constructor(private readonly storageKey: string) { }

    read<K extends keyof HeadData>(key: K): HeadData[K] {
        return AppEnv.getStore<HeadData>(this.storageKey, () => new HeadData()).get(key);
    }

    write<K extends keyof HeadData>(key: K, value: HeadData[K]): boolean {
        return AppEnv.getStore<HeadData>(this.storageKey, () => new HeadData()).set(key, value);
    }
}
/**
 * Singleton для работы со HeadData Store.
 */
export const headDataStore = new HeadDataStore('HeadData');

/**
 * Добавить модуль в зависимости страницы.
 * Метод актуален только на СП.
 * @function
 * @param modules список с названиями модулей, в обычном (Foo/bar) или библиотечном (Foo/bar:baz) синтаксисе
 * @public
 */
export function addPageDeps(modules: string[]): void {
    if (constants.isBrowserPlatform || !modules || !modules.length) {
        return;
    }
    modules.forEach((moduleName) => {
        const parsedInfo: {name: string} = Library.parse(moduleName);
        headDataStore.read('pushDepComponent')(parsedInfo.name);
    });
}

function getSerializedData(): ISerializedData {
    return AppEnv.getStateReceiver().serialize();
}

interface ISerializedData {
    additionalDeps: IDeps;
    serialized: string;
}

interface IResources {
    links: ILinksAttrsResources[];
    scripts: IScriptsAttrsResources[];
}

export interface ICollectedDeps {
    // готовые ссылки на js
    scripts: IDeps;
    // названия js модулей
    js: IDeps;
    css: {
        simpleCss: IDeps;
        themedCss: IDeps;
    };
    tmpl: IDeps;
    wml: IDeps;
    rsSerialized: string;
    rtpackModuleNames: IDeps;
    additionalDeps: IDeps;
}

interface ILinksAttrsResources  {
    href: string;
}
interface IScriptsAttrsResources  {
    src: string;
}
type KeyHeadData = keyof HeadData;
