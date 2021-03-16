/// <amd-module name="UI/_base/HeadData" />
import { IDeps } from 'UI/_base/DepsCollector';
import PageDeps from 'UI/_base/PageDeps';
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
    private _ssrTimeout: number = 0;
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
        this.setUnpackDeps = this.setUnpackDeps.bind(this);
        this.waitAppContent = this.waitAppContent.bind(this);
        this.pushDepComponent = this.pushDepComponent.bind(this);
        this.resetRenderDeferred = this.resetRenderDeferred.bind(this);
        this.setIncludedResources = this.setIncludedResources.bind(this);

        this.pageDeps = new PageDeps();
        this.resetRenderDeferred();
        this._ssrTimeout = Date.now() + HeadData.SSR_DELAY;
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
     * Таймаут построения на сп
     */
    get ssrTimeout(): number {
        return (Date.now() < this._ssrTimeout) ? this._ssrTimeout - Date.now() : 0;
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

    collectDependencies() {
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

interface ICollectedDeps {
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
