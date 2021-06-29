// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import { Logger } from 'UICommon/Utils';
import { recursiveWalker, TYPES, RequireJSPlugin } from 'WasabyLoader/RecursiveWalker';
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

interface ILocalizationResources {
   dictionary?: string;
   style?: string;
}

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


/**
 * Название модуля WS.Core, который будет указан в s3debug при частичном дебаге
 */
const WSCORE_MODULE_NAME = 'WS.Core';
/**
 * Префиксы модулей из "семейства" модулей WS.Core
 * При частичном дебаге WS.Core необходимо выбрасывать модули с префиксом из списка
 */
const WSCORE_MODULES_PREFIXES = ['Core/', 'Lib/', 'Transport/'];

function getPackageName(packageLink: string): string {
   return packageLink.replace(/^(\/resources\/|resources\/)+/, '').replace(/\.min\.(css|js)$/, '');
}

function getExt(fileName: string): string {
   const res = fileName.match(/\.\w+$/);
   if (res && res.length) {
      return res[0].slice(1);
   }

   const message = `[UICommon/_deps/DepsCollector:getExt] Incorrect extension: ${fileName}`;
   Logger.error(message);
   return '';
}

function isThemedCss(key: string): boolean {
   return key.indexOf('theme?') >= 0;
}

function removeThemeParam(name: string): string {
   return name.replace('theme?', '');
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
   const isUnpackModule = getIsUnpackModule(unpack);
   mergePacks(packs, getPacksNames(all.js, isUnpackModule, bRoute));
   mergePacks(packs, getPacksNames(all.tmpl, isUnpackModule, bRoute));
   mergePacks(packs, getPacksNames(all.wml, isUnpackModule, bRoute));

   packs.css = getCssPackages(all.css, isUnpackModule, bRoute);
   return packs;
}

/**
 * Возвращает метод, который для переданного модуля будет выяснять нужно его бандл добавлять в страницу или нет
 * Нужен при частичном дебаге, когда в s3debug указан список модулей
 * @param unpack список модулей, которые указаны в s3debug
 */
function getIsUnpackModule(unpack: IDeps): (moduleName: string) => boolean {
   // проверка модуля из семейства WS.Core
   const isWsCore = (unpackModuleName, dependModuleName): boolean => {
      if (unpackModuleName !== WSCORE_MODULE_NAME) {
         return false;
      }
      return WSCORE_MODULES_PREFIXES.some((modulePrefix: string) => dependModuleName.startsWith(modulePrefix));
   };

   return (dependModuleName: string): boolean => {
      return unpack.some((unpackModuleName) =>  {
         return dependModuleName.indexOf(unpackModuleName) !== -1
                || isWsCore(unpackModuleName, dependModuleName);
      });
   };
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
      const deps: string[] = [];
      depends
          /** Убираем пустые зависимости и зависимости, которые нужно прислать распакованными */
          .filter((d) => !!d && unpack.indexOf(d) === -1)
          /** Убираем дубликаты зависимостей */
          .forEach((d) => {
             if(deps.indexOf(d) === -1) {
                deps.push(d);
             }
          });

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
