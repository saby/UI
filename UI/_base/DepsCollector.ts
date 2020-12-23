// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import { Logger } from 'UI/Utils';
import * as Library from 'WasabyLoader/Library';
import { controller } from 'I18n/i18n';

export type IDeps = string[];
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
export interface ICollectedDeps {
   js?: {[depName: string]: IModuleInfo};
   i18n?: {[depName: string]: IModuleInfo};
   css?: {[depName: string]: IModuleInfo};
   wml?: {[depName: string]: IModuleInfo};
   tmpl?: {[depName: string]: IModuleInfo};
}

interface IModuleInfo {
   moduleName: string;
   fullName: string;
   typeInfo: IPlugin;
}

interface IPlugin {
   type: string;
   plugin: string;
   hasDeps: boolean;
   hasPacket: boolean;
   packOwnDeps: boolean;
   canBePackedInParent?: boolean;
}

interface ILocalizationResources {
   dictionary?: string;
   style?: string;
}

type RequireJSPlugin = 'js' | 'wml' | 'tmpl' | 'i18n' | 'default' | 'is' | 'browser';
type IDepPack = Record<string, DEPTYPES>;
interface IDepCSSPack {
   themedCss: IDepPack; simpleCss: IDepPack;
}
interface IDepPackages extends Record<RequireJSPlugin, IDepPack> {
   css: IDepCSSPack;
}

enum DEPTYPES {
   BUNDLE = 1,
   SINGLE = 2
}

/**
 * Соответствие плагина i18n библиотеке I18n/i18n
 * Плагин i18n requirejs по сути это то же самое, что и библиотека I18n/i18n
 * но DepsCollector не знает об этом ничего.
 */
const SPECIAL_DEPS = {
   i18n: 'I18n/i18n'
};

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

function getPlugin(name: string): string {
   let res;
   res = name.split('!')[0];
   if (res === name) {
      res = '';
   }
   return res;
}

export function getType(name: string): IPlugin | null {
   const plugin = getPlugin(name);
   for (const key in TYPES) {
      if (TYPES[key].plugin === plugin) {
         return TYPES[key];
      }
   }
   return null;
}

function getPackageName(packageLink: string): string {
   return packageLink.replace(/^(\/resources\/|resources\/)+/, '').replace(/\.min\.(css|js)$/, '');
}

function getExt(fileName: string): string {
   const res = fileName.match(/\.\w+$/);
   if (res && res.length) {
      return res[0].slice(1);
   }

   const message = `[UI/_base/DepsCollector:getExt] Incorrect extension: ${fileName}`;
   Logger.error(message);
   return '';
}

function isThemedCss(key: string): boolean {
   return key.indexOf('theme?') >= 0;
}

function removeThemeParam(name: string): string {
   return name.replace('theme?', '');
}

export function parseModuleName(name: string): IModuleInfo | null {
   const typeInfo = getType(name);
   if (typeInfo === null) {
      Logger.warn(`[UI/_base/DepsCollector:parseModuleName] Wrong type Can not process module: ${name}`);
      return null;
   }
   let nameWithoutPlugin;
   if (typeInfo.plugin) {
      nameWithoutPlugin = name.split(typeInfo.plugin + '!')[1];
   } else {
      nameWithoutPlugin = name;
   }
   const parts = Library.parse(nameWithoutPlugin);
   return {
      moduleName: parts.name,
      fullName: name,
      typeInfo
   };
}

function getEmptyPackages(): IDepPackages {
   const packages = {};
   for (const key in TYPES) {
      if (TYPES.hasOwnProperty(key)) {
         packages[key as RequireJSPlugin] = {};
      }
   }
   return packages as IDepPackages;
}

function getPacksNames(
   allDeps: ICollectedDeps = {},
   isUnpackModule: (key: string) => boolean,
   bundlesRoute: Record<string, string> = {}
): IDepPackages {
   const unpackBundles: string[] = [];
   const packages = getEmptyPackages();
   Object.keys(allDeps).forEach((moduleName) => {
      let bundleName = bundlesRoute[moduleName];
      if (!bundleName && SPECIAL_DEPS.hasOwnProperty(moduleName)) {
         bundleName = bundlesRoute[SPECIAL_DEPS[moduleName]];
      }
      if (!bundleName) { return; }
      delete allDeps[moduleName];
      const ext = getExt(bundleName);
      const packageName = getPackageName(bundleName);
      if (unpackBundles.indexOf(packageName) !== -1) { return; }
      if (isUnpackModule(moduleName)) {
         unpackBundles.push(packageName);
         delete packages[ext][packageName];
         return;
      }
      packages[ext][packageName] = DEPTYPES.BUNDLE;
   });

   Object.keys(allDeps).forEach((moduleName) => {
      const { plugin, type: ext } = allDeps[moduleName].typeInfo;
      const packageName = plugin ? moduleName.split(plugin + '!').pop() : moduleName;
      if (unpackBundles.indexOf(packageName) !== -1) { return; }
      if (isUnpackModule(moduleName)) {
         unpackBundles.push(packageName);
         delete packages[ext][packageName];
         return;
      }
      packages[ext][packageName] = DEPTYPES.SINGLE;
   });
   return packages;
}

function getCssPackages(
   allDeps: ICollectedDeps,
   isUnpackModule: (key: string) => boolean,
   bundlesRoute: Record<string, string>
): IDepCSSPack {
   const packages = {
      themedCss: {},
      simpleCss: {}
   };
   const unpackBundles: string[] = [];
   for (const key in allDeps) {
      if (allDeps.hasOwnProperty(key)) {
         const noParamsName = removeThemeParam(key);
         const bundleName = bundlesRoute[noParamsName];
         if (bundleName) {
            delete allDeps[key];
            const packageName = getPackageName(bundleName);
            if (unpackBundles.indexOf(packageName) !== -1) { continue; }
            const ext = isThemedCss(key) ? 'themedCss' : 'simpleCss';
            if (isUnpackModule(key)) {
               unpackBundles.push(packageName);
               delete packages[ext][packageName];
               continue;
            }
            packages[ext][packageName] = DEPTYPES.BUNDLE;
         }
      }
   }
   for (const key in allDeps) {
      if (allDeps.hasOwnProperty(key)) {
         const noParamsName = removeThemeParam(key).split('css!')[1];
         if (unpackBundles.indexOf(noParamsName) !== -1) { continue; }
         const ext = isThemedCss(key) ? 'themedCss' : 'simpleCss';
         if (isUnpackModule(key)) {
            unpackBundles.push(noParamsName);
            delete packages[ext][noParamsName];
            continue;
         }
         packages[ext][noParamsName] = DEPTYPES.SINGLE;
      }
   }
   return packages;
}

function getAllPackagesNames(all: ICollectedDeps, unpack: IDeps, bRoute: Record<string, string>): IDepPackages {
   const packs = getEmptyPackages();
   const isUnpackModule = (key: string) => unpack.some((moduleName) => key.indexOf(moduleName) !== -1);
   mergePacks(packs, getPacksNames(all.js, isUnpackModule, bRoute));
   mergePacks(packs, getPacksNames(all.tmpl, isUnpackModule, bRoute));
   mergePacks(packs, getPacksNames(all.wml, isUnpackModule, bRoute));

   packs.css = getCssPackages(all.css, isUnpackModule, bRoute);
   return packs;
}

function mergePacks(result: IDepPackages, addedPackages: Partial<IDepPackages>): void {
   for (const pack in addedPackages) {
      if (addedPackages.hasOwnProperty(pack)) {
         if (result[pack] === undefined) {
            result[pack] = {};
         }
         for (const key in addedPackages[pack]) {
            if (addedPackages[pack].hasOwnProperty(key)) {
               result[pack][key] = addedPackages[pack][key];
            }
         }
      }
   }
}

/**
 * Create object which contains all nodes of dependency tree.
 * { js: {}, css: {}, ..., wml: {} }
 * @param allDeps
 * @param curNodeDeps
 * @param modDeps
 */
export function recursiveWalker(
   allDeps: ICollectedDeps,
   curNodeDeps: IDeps,
   modDeps: Record<string, IDeps>,
   modInfo: object,
   skipDep: boolean = false
): void {
   if (curNodeDeps && curNodeDeps.length) {
      for (let i = 0; i < curNodeDeps.length; i++) {
         let node = curNodeDeps[i];
         const splitted = node.split('!');
         if (splitted[0] === 'optional' && splitted.length > 1) {
            // OPTIONAL BRANCH
            splitted.shift();
            node = splitted.join('!');
            if (!modInfo[node]) {
               continue;
            }
         }
         const module = parseModuleName(node);
         if (module) {
            const moduleType = module.typeInfo.type;
            if (!allDeps[moduleType]) {
               allDeps[moduleType] = {};
            }
            if (!allDeps[moduleType][node]) {
               if (!(skipDep && !!module.typeInfo.canBePackedInParent)) {
                  allDeps[moduleType][module.fullName] = module;
               }
               if (module.typeInfo.hasDeps) {
                  const nodeDeps = modDeps[node] || modDeps[module.moduleName];
                  recursiveWalker(allDeps, nodeDeps, modDeps, modInfo, !!module.typeInfo.packOwnDeps);
               }
            }
         }
      }
   }
}
/**
 * Модуль для коллекции зависимостей на СП
 */
export class DepsCollector {
   modDeps: Record<string, IDeps>;
   modInfo: object;
   bundlesRoute: Record<string, string>;

   /**
    * @param modDeps - object, contains all nodes of dependency tree
    * @param modInfo - contains info about path to module files
    * @param bundlesRoute - contains info about custom packets with modules
    */
   constructor(modDeps: Record<string, IDeps>, modInfo: object, bundlesRoute: Record<string, string>) {
      this.modDeps = modDeps;
      this.modInfo = modInfo;
      this.bundlesRoute = bundlesRoute;
   }

   collectDependencies(depends: IDeps = [], unpack: IDeps = []): ICollectedFiles {
      /** Убираем дубликаты зависимостей */
      const deps = depends
         .filter((d) => !!d && unpack.indexOf(d) === -1)
         .filter((d, i) => depends.indexOf(d) === i);

      const files: ICollectedFiles = {
         js: [],
         css: { themedCss: [], simpleCss: [] },
         tmpl: [],
         wml: []
      };
      const allDeps = {};
      recursiveWalker(allDeps, deps, this.modDeps, this.modInfo);

      // Add i18n dependencies
      if (allDeps.hasOwnProperty('i18n')) {
         this.collectI18n(files, allDeps);
      }
      // Find all bundles, and removes dependencies that are included in bundles
      const packages = getAllPackagesNames(allDeps, unpack, this.bundlesRoute);

      for (const key in packages.js) {
         if (packages.js.hasOwnProperty(key)) {
            files.js.push(key);
         }
      }
      for (const key in packages.tmpl) {
         if (packages.tmpl.hasOwnProperty(key)) {
            files.tmpl.push(key);
         }
      }
      for (const key in packages.wml) {
         if (packages.wml.hasOwnProperty(key)) {
            files.wml.push(key);
         }
      }
      for (const key in packages.css.themedCss) {
         if (packages.css.themedCss.hasOwnProperty(key)) {
            files.css.themedCss.push(key);
         }
      }
      for (const key in packages.css.simpleCss) {
         if (packages.css.simpleCss.hasOwnProperty(key)) {
            files.css.simpleCss.push(key);
         }
      }
      return files;
   }

   /**
    * Добавляет ресурсы локализации, которые надо подключить в вёрстку.
    * @param files {ICollectedFiles} - набор файлов для добавления в вёрстку
    * @param deps {ICollectedDeps} - набор зависимостей, которые участвовали в построение страницы.
    */
   collectI18n(files: ICollectedFiles, deps: ICollectedDeps): void {
      const loadedContexts = controller.loadingsHistory.contexts;
      const localeCode = controller.currentLocale;
      const langCode = controller.currentLang;
      const processedContexts = [];

      // Добавляем конфигурацию локали.
      files.js.push(controller.loadingsHistory.locales[localeCode]);

      for (const moduleModule of Object.keys(deps.i18n)) {
         const UIModuleName = deps.i18n[moduleModule].moduleName.split('/')[0];

         if (processedContexts.includes(UIModuleName)) {
            continue;
         }

         processedContexts.push(UIModuleName);

         if (!loadedContexts.hasOwnProperty(UIModuleName)) {
            continue;
         }

         const loadedResources = loadedContexts[UIModuleName];

         if (controller.loadingsHistory.contents.hasOwnProperty(UIModuleName)) {

            // Добавляем contents для модулей с внешних сервисов, с информацией о доступных ресурсах локализации.
            files.js.push(controller.loadingsHistory.contents[UIModuleName]);
         }

         if (loadedResources.hasOwnProperty(localeCode)) {
            this.addLocalizationResource(files, loadedResources[localeCode]);

            continue;
         }

         if (loadedResources.hasOwnProperty(langCode)) {
            this.addLocalizationResource(files, loadedResources[langCode]);
         }
      }
   }

   private addLocalizationResource(files: ICollectedFiles, availableResources: ILocalizationResources): void {
      if (availableResources.dictionary) {
         files.js.push(availableResources.dictionary);
      }

      if (availableResources.style) {
         files.css.simpleCss.push(availableResources.style);
      }
   }
}
