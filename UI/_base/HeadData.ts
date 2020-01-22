/// <amd-module name="UI/_base/HeadData" />
// @ts-ignore
import ThemesController = require('Core/Themes/ThemesController');
// @ts-ignore
import { cookie } from 'Env/Env';
// @ts-ignore
import { DepsCollector, ICollectedFiles } from './DepsCollector';
// @ts-ignore
import * as AppEnv from 'Application/Env';
import { IStore } from 'Application/Interface';
/**
 * в s3debug может быть true или строка-перечисление имен непакуемых ресурсов
 * https://online.sbis.ru/opendoc.html?guid=1d5ab888-6f9e-4ee0-b0bd-12e788e60ed9
 */
let bundles;
let modDeps;
let contents = {};
const isDebug = () => cookie.get('s3debug') && cookie.get('s3debug') !== 'false' || contents?.['buildMode'] === 'debug';
// Need these try-catch because:
// 1. We don't need to load these files on client
// 2. We don't have another way to check if these files exists on server
try {
    // TODO https://online.sbis.ru/opendoc.html?guid=7e096cc5-d95a-48b9-8b71-2a719bd9886f
    // Need to fix this, to remove hardcoded paths
    // tslint:disable-next-line:no-var-requires
    modDeps = require('json!resources/module-dependencies');
} catch (e) {
    // ignore
}
try {
    // tslint:disable-next-line:no-var-requires
    contents = require('json!resources/contents');
} catch (e) {
    // ignore
}
try {
    // tslint:disable-next-line:no-var-requires
    bundles = require('json!resources/bundlesRoute');
} catch (e) {
    // ignore
}

bundles = bundles || {};
modDeps = modDeps || { links: {}, nodes: {} };

export default class HeadData implements IStore<Record<keyof HeadData, any>> {
    static readonly SSR_DELAY = 20000;
    isDebug: boolean;
    // переедет в константы реквеста, изменяется в Controls/Application
    isNewEnvironment: boolean = false;
    private depComponentsMap: object = {};
    private additionalDeps: object = {};
    private waiterDef: Promise<any> = null;
    private themesActive: boolean = true;
    private err: string;
    private resolve: Function = null;
    private renderPromise: Promise<any> = null;
    private ssrEndTime: number = null;

    constructor() {
        this.renderPromise = new Promise((resolve) => {
            this.resolve = resolve;
        });
        this.isDebug = isDebug();
        this.ssrEndTime = Date.now() + HeadData.SSR_DELAY;
        this.get = this.get.bind(this);
        this.set = this.set.bind(this);
        this.getKeys = this.getKeys.bind(this);
        this.toObject = this.toObject.bind(this);
        this.waitAppContent = this.waitAppContent.bind(this);
        this.pushDepComponent = this.pushDepComponent.bind(this);
        this.pushWaiterDeferred = this.pushWaiterDeferred.bind(this);
        this.ssrWaitTimeManager = this.ssrWaitTimeManager.bind(this);
        this.resetRenderDeferred = this.resetRenderDeferred.bind(this);
    }

    /* toDO: StateRec.register */
    pushDepComponent(componentName: string, needRequire: boolean): void {
        this.depComponentsMap[componentName] = true;
        if (needRequire) {
            this.additionalDeps[componentName] = true;
        }
    }

    ssrWaitTimeManager(): number {
        if (Date.now() < this.ssrEndTime) {
            return this.ssrEndTime - Date.now();
        } else {
            return 0;
        }
    }

    pushWaiterDeferred(def: Promise<any>): void {
        const depsCollector = getDepsCollector();
        this.waiterDef = def;
        this.waiterDef.then(() => {
            if (!this.resolve) {
                return;
            }
            const components = Object.keys(this.depComponentsMap);
            let files:ICollectedFiles;
            if (this.isDebug) {
                files = {
                    js: [],
                    css: { themedCss: [], simpleCss: [] },
                    tmpl: [],
                    wml: []
                };
            } else {
                files = depsCollector.collectDependencies(components);
                initThemesController(files.css.themedCss, files.css.simpleCss);
            }

            const rcsData = getSerializedData();
            const additionalDepsArray = [];
            for (const key in rcsData.additionalDeps) {
                if (rcsData.additionalDeps.hasOwnProperty(key)) {
                    additionalDepsArray.push(key);
                }
            }

            // Костыль. Чтобы сериализовать receivedState, нужно собрать зависимости, т.к. в receivedState у компонента
            // Application сейчас будет список css, для восстановления состояния с сервера.
            // Но собирать зависимости нам нужно после receivedState, потому что в нем могут тоже могут быть зависимости
            const additionalDeps = depsCollector.collectDependencies(additionalDepsArray);

            files.js = files.js || [];
            if (!this.isDebug) {
                for (let i = 0; i < additionalDeps.js.length; i++) {
                    if (files.js.indexOf(additionalDeps.js[i]) === -1) {
                        files.js.push(additionalDeps.js[i]);
                    }
                }
            }
            this.resolve({
                js: files.js || [],
                tmpl: files.tmpl || [],
                css: files.css || { themedCss: [], simpleCss: [] },
                receivedStateArr: rcsData.serialized,
                additionalDeps: Object.keys(rcsData.additionalDeps).concat(Object.keys(this.additionalDeps))
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

function getDepsCollector(): DepsCollector {
    return new DepsCollector(modDeps.links, modDeps.nodes, bundles);
}

function initThemesController(themedCss, simpleCss): any {
    return ThemesController.getInstance().initCss({
        themedCss: themedCss,
        simpleCss: simpleCss
    });
}

function getSerializedData(): any {
    return AppEnv.getStateReceiver().serialize();
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