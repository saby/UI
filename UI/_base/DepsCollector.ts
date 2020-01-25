/// <amd-module name="UI/_base/DepsCollector" />

//@ts-ignore
import { Logger } from 'UI/Utils';
//@ts-ignore
import { constants } from 'Env/Env';
//@ts-ignore
import i18n = require('Core/i18n');

// #region interface
/** type means js resource */
type ResourceType = 'css'| 'themedCss' | 'wml' | 'tmpl' | 'js';
type IDep = string;
type IDeps = IDep[];
interface IPageResources {
   themedCss: IResorceInfo;
   css: IResorceInfo;
   tmpl: IResorceInfo;
   wml: IResorceInfo;
   js: IResorceInfo;
}
interface IResorceInfo {
   moduleName: string,
   fullName: string,
   typeInfo: IResourceConfig;
}
interface IResourceConfig{
   hasDeps: boolean,
   hasPacket: boolean,
   canBePackedInParent?: boolean
   packOwnDeps?: boolean
}
/** 
 * contains all nodes of dependency tree
 * {
 *    module_name: [
 *       wml!path
 *       dep_module
 *       i18n!path
 *    ]   
 * }
 */
interface IModulesDeps {
   [name: string]: IDeps;
}
/** 
 * info about path to module files 
 * { 
 *    module_name: {
 *       path: module_path.min.js
 *       amd: true
 *    }
 *  }
 */
interface IModuleInfo {
   [name: string]: {
      path: IDep;
      amd: boolean
   };
}
/** Info extracted from the module name */
interface IModuleNameInfo {
   type: ResourceType,
   name: string;
   fullName: string;
   config: IResourceConfig;
}
/** 
 * Принадлежность ресурса к кастомному бандлу
 * Т.е все module_name пакуются в package либо не пакуются вообще (не библиотеки)
 * { module_name: package_path.js }
 */
interface IPackagesRoute {
   [name: string]: string;
}

type IBundleCollection = {
   [resource in ResourceType]: {
      [pack: string]: BUNDLING;
   };
}
// #endregion
enum BUNDLING { PACKAGE, LIBRARY };

const requireJsPlugins: { [resource in ResourceType]: IResourceConfig } = {
   js: {
      hasDeps: true,
      hasPacket: true,
      packOwnDeps: true
   },
   tmpl: {
      hasDeps: true,
      hasPacket: false,
      canBePackedInParent: true
   },
   wml: {
      hasDeps: true,
      hasPacket: false,
      canBePackedInParent: true
   },
   css: {
      hasDeps: false,
      hasPacket: true
   },
   themedCss: {
      hasDeps: false,
      hasPacket: true
   },
};

// #region helpers
function getRequireJSPlugin(name): ResourceType {
   const [plugin]: ResourceType[] = name.split('!');
   return (plugin === name) ? 'js' : plugin;
}

function getResourceConfig(name: string): IResourceConfig | null {
   const type = getRequireJSPlugin(name);
   if (!(type in requireJsPlugins)){
      Logger.info(`Неизвестное расширение ресурса ${type}::${typeof type}`);
      return null;
   }
   return requireJsPlugins[type];
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
   return key.indexOf('theme?') !== -1;
}

function removeThemeParam(name: string): string {
   return name.replace('theme?', '');
}

function parseModuleName(fullName: string): IModuleNameInfo | null {
   const config = getResourceConfig(fullName);
   if (Object.is(config, null)) {
      // TODO Change to error after https://online.sbis.ru/opendoc.html?guid=5de9d9bd-be4a-483a-bece-b41983e916e4
      Logger.info(`[UI/_base/DepsCollector:parseModuleName] Wrong type Can not process module: ${fullName}`);
      return null;
   }
   const [type, name] = <[ResourceType, string]> fullName.split('!');
   return {type, name, fullName, config };
}

function getEmptyPackages(): any {
   const packages = {};
   for (const key in requireJsPlugins) {
      if (requireJsPlugins.hasOwnProperty(key)) {
         packages[key] = {};
      }
   }
   return packages;
}

function getBundles(resources: IPageResources, route: IPackagesRoute): IBundleCollection {
   
}

function getPacksNames(allDeps: IResorceInfo, bundlesRoute: any): any {
   const packages = getEmptyPackages();
   for (const key in allDeps) {
      if (allDeps.hasOwnProperty(key)) {
         const bundleName = bundlesRoute[key];
         if (bundleName) {
            Logger.info(`[UI/_base/DepsCollector:getPacksNames] Custom packets logs, module ${key} in bundle ${bundleName}`);
            delete allDeps[key];
            const ext = getExt(bundleName);
            packages[ext][getPackageName(bundleName)] = BUNDLING.PACKAGE;
         }
      }
   }
   for (const key in allDeps) {
      if (allDeps.hasOwnProperty(key)) {
         const ext = allDeps[key].config.type;
         if (allDeps[key].config.plugin) {
            packages[ext][key.split(allDeps[key].config.plugin + '!')[1]] = BUNDLING.LIBRARY;
         } else {
            packages[ext][key] = BUNDLING.LIBRARY;
         }
      }
   }
   return packages;
}
function getCssPackages(allDeps: IPackagesRoute, bundlesRoute: IPackagesRoute): any {
   const packages = { };
   for (const key in allDeps) {
      /**
       * Перебор зависимостей allDeps, если в bundlesRoute указан ресурс, 
       * добавляем как название пакета ex.: "OnlineSidebar/vdom-sidebar.package": 1,
       */
      if (allDeps.hasOwnProperty(key)) {
         let noParamsName = removeThemeParam(key);
         const bundleName = bundlesRoute[noParamsName];
         if (bundleName) {
            Logger.info(`[UI/_base/DepsCollector:getCssPackages] Custom packets logs, module ${key} in bundle ${bundleName}`);
            delete allDeps[key];
            if (isThemedCss(key)) {
               packages.themedCss[getPackageName(bundleName)] = BUNDLING.PACKAGE;
            } else {
               packages.simpleCss[getPackageName(bundleName)] = BUNDLING.PACKAGE;
            }
         }
      }
   }
   /**
    * Все не пакеты добавляются как либы
    */
   for (const key in allDeps) {
      if (allDeps.hasOwnProperty(key)) {
         let noParamsName = removeThemeParam(key).split('css!')[1];
         if (isThemedCss(key)) {
            packages.themedCss[noParamsName] = BUNDLING.LIBRARY;
         } else {
            packages.simpleCss[noParamsName] = BUNDLING.LIBRARY;
         }
      }
   }
   return packages;
}

function getAllPackagesNames(all: IPageResources, bRoute: IPackagesRoute): IBundleCollection {
   const packs = getEmptyPackages();
   mergePacks(packs, getPacksNames(all.js, bRoute));
   mergePacks(packs, getPacksNames(all.tmpl, bRoute));
   mergePacks(packs, getPacksNames(all.wml, bRoute));

   packs.css = getCssPackages(all.css, bRoute);
   return packs;
}

function mergePacks(result: any, addedPackages: any): void {
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
function recursiveWalker(allDeps: any, curNodeDeps: any, modDeps: any, modInfo: any, skipDep?: any): void {
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
         const info = parseModuleName(node);
         const { type, config, fullName } = info;
         if (!allDeps[type]) {
            allDeps[type] = {};
         }
         if (allDeps[type][node]) { return; }
         if (!(skipDep && !!config.canBePackedInParent)) {
            allDeps[type][fullName] = info;
         }
         if (!config.hasDeps) { return; }
         const nodeDeps = modDeps[node];
         recursiveWalker(allDeps, nodeDeps, modDeps, modInfo, !!config.packOwnDeps);
      }
   }
}
// #endregion
class DepsCollector {
   /**
    * @param modDeps - object, contains all nodes of dependency tree
    * @param modInfo - contains info about path to module files
    * @param bundlesRoute - contains info about custom packets with modules
    */
   constructor(
      private modDeps: IModulesDeps, 
      private modInfo: IModuleInfo, 
      private bundlesRoute: IPackagesRoute
      ) {
   }

   public collectDependencies(deps: IDeps): IPageResources {
      const files: IPageResources = {
         js: [],
         css: { themedCss: [], simpleCss: [] },
         tmpl: [],
         wml: []
      };
      const allDeps = {};
      recursiveWalker(allDeps, deps, this.modDeps, this.modInfo);

      // Find all bundles, and removes dependencies that are included in bundles
      const packages = getAllPackagesNames(allDeps, this.bundlesRoute);

      // Add i18n dependencies
      this.collectI18n(files, packages);

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
      for (const key in packages.themedCss) {
         if (packages.themedCss.hasOwnProperty(key)) {
            if (!packages.js[key] && packages.themedCss[key] === BUNDLING.PACKAGE) {
               files.js.push(key);
            }
            files.themedCss.push(key);
         }
      }
      for (const key in packages.css) {
         if (packages.css.hasOwnProperty(key)) {
            if (!packages.js[key] && packages.css[key] === BUNDLING.PACKAGE) {
               files.js.push(key);
            }
            files.css.push(key);
         }
      }
      return files;
   }
   getLang() {
      return i18n.getLang();
   }
   getLangNoLocale(lang) {
      return lang.split('-')[0];
   }
   getAvailableDictList(lang) {
      return i18n._dictNames[lang] || {};
   }
   getModules() {
      return constants.modules;
   }
   collectI18n(files, packages) {
      let collectedDictList = {};
      const langLocale = this.getLang();
      const langNoLocale = this.getLangNoLocale(langLocale);
      const availableDictList = this.getAvailableDictList(langLocale);
      const modules = this.getModules();
      for (var key in packages.js) {
         let module = key.split('/')[0];
         let moduleLangNoLocale = module + '/lang/' + langNoLocale + '/' + langNoLocale;
         let moduleLangWithLocale = module + '/lang/' + langLocale + '/' + langLocale;
         let isAvailableWithLocale = !!availableDictList[moduleLangWithLocale + '.json'],
            isAvailableNoLocale = !!availableDictList[moduleLangNoLocale + '.json'];
         if (isAvailableWithLocale || isAvailableNoLocale) {
            collectedDictList[module] = [];
            if (isAvailableWithLocale) {
               collectedDictList[module].push({ moduleLang: moduleLangWithLocale, lang: langLocale });
            }
            if (isAvailableNoLocale) {
               collectedDictList[module].push({ moduleLang: moduleLangNoLocale, lang: langNoLocale });
            }
         }
      }
      for (var key in collectedDictList) {
         if (collectedDictList.hasOwnProperty(key)) {
            let currentDicts = collectedDictList[key];
            for (let i = 0; i < currentDicts.length; i++) {
               files.js.push(currentDicts[i].moduleLang + '.json');
               if (modules[key].dict && modules[key].dict && ~modules[key].dict.indexOf(currentDicts[i].lang + '.css')) {
                  files.css.push(currentDicts[i].moduleLang);
               }
            }
         }
      }
   }
}

export {
   DepsCollector,
   IPageResources
};
