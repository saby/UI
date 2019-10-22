/// <amd-module name="UI/_base/DepsCollector" />

import * as logger from 'UI/Logger';
import { constants } from 'Env/Env';
import i18n = require('Core/i18n');

interface ICollectedFiles {
   js: Array<String>,
   css: { themedCss: Array<String>, simpleCss: Array<String> },
   tmpl: Array<String>,
   wml: Array<String>
}
const DEPTYPES = {
   BUNDLE: 1,
   SINGLE: 2
};
const TYPES = {
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

function getType(name: string): any {
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
   logger.error(message);
   return '';
}

function isThemedCss(key: string): boolean {
   return key.indexOf('theme?') >= 0;
}

function removeThemeParam(name) {
   return name.replace('theme?', '');
}

function parseModuleName(name: string): any {
   const typeInfo = getType(name);
   if (typeInfo === null) {
      // TODO Change to error after https://online.sbis.ru/opendoc.html?guid=5de9d9bd-be4a-483a-bece-b41983e916e4
      logger.log(`[UI/_base/DepsCollector:parseModuleName] Wrong type Can not process module: ${name}`);
      return null;
   }
   let nameWithoutPlugin;
   if (typeInfo.plugin) {
      nameWithoutPlugin = name.split(typeInfo.plugin + '!')[1];
   } else {
      nameWithoutPlugin = name;
   }
   return {
      moduleName: nameWithoutPlugin,
      fullName: name,
      typeInfo
   };
}

function getEmptyPackages(): any {
   const packages = {};
   for (const key in TYPES) {
      if (TYPES.hasOwnProperty(key)) {
         packages[key] = {};
      }
   }
   return packages;
}

function getPacksNames(allDeps: any, bundlesRoute: any): any {
   const packages = getEmptyPackages();
   for (const key in allDeps) {
      if (allDeps.hasOwnProperty(key)) {
         const bundleName = bundlesRoute[key];
         if (bundleName) {
            logger.log(`[UI/_base/DepsCollector:getPacksNames] Custom packets logs, module ${key} in bundle ${bundleName}`);
            delete allDeps[key];
            const ext = getExt(bundleName);
            packages[ext][getPackageName(bundleName)] = DEPTYPES.BUNDLE;
         }
      }
   }
   for (const key in allDeps) {
      if (allDeps.hasOwnProperty(key)) {
         const ext = allDeps[key].typeInfo.type;
         if (allDeps[key].typeInfo.plugin) {
            packages[ext][key.split(allDeps[key].typeInfo.plugin + '!')[1]] = DEPTYPES.SINGLE;
         } else {
            packages[ext][key] = DEPTYPES.SINGLE;
         }
      }
   }
   return packages;
}

function getCssPackages(allDeps: any, bundlesRoute: any): any {
   const packages = {
      themedCss: {},
      simpleCss: {}
   };
   for (const key in allDeps) {
      if (allDeps.hasOwnProperty(key)) {
         let noParamsName = removeThemeParam(key);
         const bundleName = bundlesRoute[noParamsName];
         if (bundleName) {
            logger.log(`[UI/_base/DepsCollector:getCssPackages] Custom packets logs, module ${key} in bundle ${bundleName}`);
            delete allDeps[key];
            if (isThemedCss(key)) {
               packages.themedCss[getPackageName(bundleName)] = DEPTYPES.BUNDLE;
            } else {
               packages.simpleCss[getPackageName(bundleName)] = DEPTYPES.BUNDLE;
            }
         }
      }
   }
   for (const key in allDeps) {
      if (allDeps.hasOwnProperty(key)) {
         let noParamsName = removeThemeParam(key).split('css!')[1];
         if (isThemedCss(key)) {
            packages.themedCss[noParamsName] = DEPTYPES.SINGLE;
         } else {
            packages.simpleCss[noParamsName] = DEPTYPES.SINGLE;
         }
      }
   }
   return packages;
}

function getAllPackagesNames(all: any, bRoute: any): any {
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
                  const nodeDeps = modDeps[node];
                  recursiveWalker(allDeps, nodeDeps, modDeps, modInfo, !!module.typeInfo.packOwnDeps);
               }
            }
         }
      }
   }
}

interface ILangModuleInfo {
   moduleLang: string;
   lang: string;
}

class DepsCollector {
   modDeps: any;
   modInfo: any;
   bundlesRoute: any;

   /**
    * @param modDeps - object, contains all nodes of dependency tree
    * @param modInfo - contains info about path to module files
    * @param bundlesRoute - contains info about custom packets with modules
    */
   constructor(modDeps: any, modInfo: any, bundlesRoute: any) {
      this.modDeps = modDeps;
      this.modInfo = modInfo;
      this.bundlesRoute = bundlesRoute;
   }

   public collectDependencies(deps: any): ICollectedFiles {
      const files: ICollectedFiles = {
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
      for (const key in packages.css.themedCss) {
         if (packages.css.themedCss.hasOwnProperty(key)) {
            if (!packages.js[key] && packages.css.themedCss[key] === DEPTYPES.BUNDLE) {
               files.js.push(key);
            }
            files.css.themedCss.push(key);
         }
      }
      for (const key in packages.css.simpleCss) {
         if (packages.css.simpleCss.hasOwnProperty(key)) {
            if (!packages.js[key] && packages.css.simpleCss[key] === DEPTYPES.BUNDLE) {
               files.js.push(key);
            }
            files.css.simpleCss.push(key);
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
                  files.css.simpleCss.push(currentDicts[i].moduleLang);
               }
            }
         }
      }
   }
}

export {
   DepsCollector,
   ICollectedFiles
};
