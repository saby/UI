/// <amd-module name="UICommon/_deps/Interface" />

export interface ICollectedFiles extends ICollectedCSS, ICollectedTemplates {
    js: string[];
}
export interface ICollectedCSS {
    css: {
        themedCss: string[];
        simpleCss: string[];
    };
}
export interface ICollectedTemplates {
    tmpl: string[];
    wml: string[];
}
export interface ICollectedDepsRaw {
    js?: {[depName: string]: IModuleInfo};
    i18n?: {[depName: string]: IModuleInfo};
    css?: {[depName: string]: IModuleInfo};
    wml?: {[depName: string]: IModuleInfo};
    tmpl?: {[depName: string]: IModuleInfo};
}

export interface IModuleInfo {
    moduleName: string;
    fullName: string;
    typeInfo: IPlugin;
}

export interface IPlugin {
    type: string;
    plugin: string;
    hasDeps: boolean;
    hasPacket: boolean;
    packOwnDeps: boolean;
    canBePackedInParent?: boolean;
}

export interface ILocalizationResources {
    dictionary?: string;
    style?: string;
}

export interface ISerializedData {
    additionalDeps: IDeps;
    serialized: string;
}

export interface IResources {
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

export interface ILinksAttrsResources  {
    href: string;
}
export interface IScriptsAttrsResources  {
    src: string;
}

export interface IDepCSSPack {
    themedCss: IDepPack; simpleCss: IDepPack;
}

export interface IDepPackages extends Record<RequireJSPlugin, IDepPack> {
    css: IDepCSSPack;
}

export interface IParsedName {
    name: string;
    path: string[];
}

export interface IContents {
    buildMode: string;
    buildnumber: string;
    htmlNames: Record<string, string>;
    jsModules: object;
    modules: IModules;
}
export interface IModules {
    [mod: string]: {
        path?: string;
    };
}
export interface IModulesDeps {
    nodes: Record<string, { path: string, amd: boolean; }>;
    links: Record<string, IDeps>;
    packedLibraries: Record<string, IDeps>;
    lessDependencies: object;
}

export interface IModulesDescription extends IModulesDeps {
    bundles: IBundlesRoute;
}

export enum DEPTYPES {
    BUNDLE = 1,
    SINGLE = 2
}

type IBundlesRoute = Record<string, string>;
export type IDeps = string[];
export type RequireJSPlugin = 'js' | 'wml' | 'tmpl' | 'i18n' | 'default' | 'is' | 'browser';
export type IDepPack = Record<string, DEPTYPES>;
export const TYPES: Record<RequireJSPlugin | 'css', object> = {
    tmpl: {
        type: 'tmpl',
        plugin: 'tmpl',
        hasDeps: true,
        hasPacket: false,
        canBePackedInParent: true
    },
    js: {
        type: 'js',
        plugin: '',
        hasDeps: true,
        hasPacket: true,
        packOwnDeps: true
    },
    wml: {
        type: 'wml',
        plugin: 'wml',
        hasDeps: true,
        hasPacket: false,
        canBePackedInParent: true
    },
    i18n: {
        type: 'i18n',
        plugin: 'i18n',
        hasDeps: false,
        hasPacket: false,
        canBePackedInParent: false
    },
    is: {
        type: 'is',
        plugin: 'is',
        hasDeps: false,
        hasPacket: false,
        canBePackedInParent: false
    },
    browser: {
        type: 'browser',
        plugin: 'browser',
        hasDeps: true,
        hasPacket: true,
        packOwnDeps: true
    },
    css: {
        type: 'css',
        plugin: 'css',
        hasDeps: false,
        hasPacket: true
    },
    default: {
        hasDeps: false
    }
};
