/// <amd-module name="UI/_base/HeadData" />
// @ts-ignore
import ThemesController = require('Core/Themes/ThemesController');
import { IDeps } from 'UI/_base/DepsCollector';
import PageDeps from 'UI/_base/PageDeps';
// @ts-ignore
import * as AppEnv from 'Application/Env';
import { IStore } from 'Application/Interface';

export default class HeadData implements IStore<Record<keyof HeadData, any>> {
    static readonly SSR_DELAY = 20000;
    isDebug: boolean;
    // переедет в константы реквеста, изменяется в Controls/Application
    isNewEnvironment: boolean = false;
    pageDeps: PageDeps;
    private initDeps: string[] = [];
    private requireInitDeps: string[] = [];
    private themesActive: boolean = true;
    private resolve: Function = null;
    private renderPromise: Promise<any> = null;
    private _ssrTimeout: number = 0;

    constructor() {
        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.getKeys = this.getKeys.bind(this);
        this.toObject = this.toObject.bind(this);
        this.collectDeps = this.collectDeps.bind(this);
        this.waitAppContent = this.waitAppContent.bind(this);
        this.pushDepComponent = this.pushDepComponent.bind(this);
        this.resetRenderDeferred = this.resetRenderDeferred.bind(this);

        this.pageDeps = new PageDeps();
        this.resetRenderDeferred();
        this._ssrTimeout = Date.now() + HeadData.SSR_DELAY;
    }

    /* toDO: StateRec.register */
    pushDepComponent(componentName: string, needRequire: boolean = false): void {
        this.initDeps.push(componentName);
        if (needRequire) {
            this.requireInitDeps.push(componentName);
        }
    }

    get ssrTimeout(): number {
        return (Date.now() < this._ssrTimeout) ? this._ssrTimeout - Date.now() : 0;
    }

    collectDeps(tempLoading: Promise<void>): void {
        tempLoading.then(() => {
            if (!this.resolve) {
                return;
            }
            const { additionalDeps: rsDeps, serialized: rsSerialized } = getSerializedData();
            const prevDeps = Object.keys(rsDeps);
            const files = this.pageDeps.collect([...prevDeps, ...this.initDeps]);
            initThemesController(files.css.themedCss, files.css.simpleCss);
            this.resolve({
                ...files,
                rsSerialized,
                additionalDeps: [...prevDeps, ...this.requireInitDeps]
            });
            this.resolve = null;
        });
    }

    waitAppContent(): Promise<any> {
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
    remove() { }
    getKeys(): (keyof HeadData)[] {
        return <(keyof HeadData)[]> Object.keys(this);
    };
    toObject() {
        return Object.assign({}, this);
    }
    // #endregion
}

class HeadDataStore {
    constructor (private readonly storageKey: string) { }

    read<K extends keyof HeadData>(key: K): HeadData[K] {
        return AppEnv.getStore<HeadData>(this.storageKey, () => new HeadData()).get(key);
    }

    write<K extends keyof HeadData>(key: K, value: HeadData[K]) {
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

function initThemesController(themedCss: string[], simpleCss: string[]): void {
    ThemesController.getInstance().initCss({ themedCss, simpleCss });
}

interface ISerializedData {
    additionalDeps: IDeps;
    serialized: string;
}
