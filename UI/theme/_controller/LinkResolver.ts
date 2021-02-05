/// <amd-module name="UI/theme/_controller/LinkResolver" />
/**
 * Модуль для вычисления путей до статических ресурсов
 * @author Санников К.А.
 */
import { getResourceUrl } from 'UI/Utils';
// @ts-ignore
import { constants } from 'Env/Env';

// Need this code for compatibility with old controls
// Some old module names are not the same as its physical address
// So we need to replace parts of these adresses
// We cannot get it from require's config.js because it's not amd-module
// native require doesn't work properly with relative paths while building html.tmpl
// and we doesn't have baseUrl to create absolute path
function createRequireRoutes(): any {
   return {
      WS: 'WS.Core',
      Lib: 'WS.Core/lib',
      Ext: 'WS.Core/lib/Ext',
      Deprecated: 'WS.Deprecated',
      Helpers: 'WS.Core/core/helpers',
      Transport: 'WS.Core/transport',
      bootup: 'WS.Core/res/js/bootup',
      'bootup-min': 'WS.Core/res/js/bootup-min',
      'old-bootup': 'WS.Core/res/js/old-bootup',
      tslib: 'WS.Core/ext/tslib',
      Resources: '',
      Core: 'WS.Core/core',
      css: 'RequireJsLoader/plugins/css',
      'native-css': 'RequireJsLoader/plugins/native-css',
      normalize: 'RequireJsLoader/plugins/normalize',
      html: 'RequireJsLoader/plugins/html',
      tmpl: 'RequireJsLoader/plugins/tmpl',
      wml: 'RequireJsLoader/plugins/wml',
      text: 'RequireJsLoader/plugins/text',
      is: 'RequireJsLoader/plugins/is',
      'is-api': 'RequireJsLoader/plugins/is-api',
      i18n: 'I18n/i18n',
      json: 'RequireJsLoader/plugins/json',
      order: 'RequireJsLoader/plugins/order',
      template: 'RequireJsLoader/plugins/template',
      cdn: 'RequireJsLoader/plugins/cdn',
      datasource: 'RequireJsLoader/plugins/datasource',
      xml: 'RequireJsLoader/plugins/xml',
      preload: 'RequireJsLoader/plugins/preload',
      browser: 'RequireJsLoader/plugins/browser',
      optional: 'RequireJsLoader/plugins/optional',
      remote: 'RequireJsLoader/plugins/remote',

      router: 'router',

      jquery: '/cdn/JQuery/jquery/3.3.1/jquery-min',
      react: 'UI/_react/third-party/react.production.min',
      'react-dom': 'UI/_react/third-party/react-dom.production.min',
      'react/jsx-runtime': 'UI/_react/third-party/react-jsx-runtime.production.min',
      'react/jsx-dev-runtime': 'UI/_react/third-party/react-jsx-dev-runtime.production.min'
   };
}

// Сделано для безболезненного внедрения новой схемы темизации на страницы,
// где уже используется темизация(схема сборки с конфигами)
// Если контрол вставляется на странице, у которой стоит сверху тема dark-large,
// нужно считать, что у него тема retail__dark-large
// Для online-default тоже самое. Если контролу приходит тема online-default,
// значит он должен строиться в теме default.
// Темы online-default в итоге не будет
const newThemeMap = {
   'dark-large': 'retail__dark-large',
   'dark-lmedium': 'retail__dark-lmedium',
   'dark-medium': 'retail__dark-medium',
   'dark-xlarge': 'retail__dark-xlarge',
   'dark-xxlarge': 'retail__dark-xxlarge',
   'header-dark-large': 'retail__header-dark-large',
   'header-dark-lmedium': 'retail__header-dark-lmedium',
   'header-dark-medium': 'retail__header-dark-medium',
   'header-dark-xlarge': 'retail__header-dark-xlarge',
   'header-dark-xxlarge': 'retail__header-dark-xxlarge',
   'header-light-large': 'retail__header-light-large',
   'header-light-lmedium': 'retail__header-light-lmedium',
   'header-light-medium': 'retail__header-light-medium',
   'header-light-xlarge': 'retail__header-light-xlarge',
   'header-light-xxlarge': 'retail__header-light-xxlarge',
   'light-large': 'retail__light-large',
   'light-lmedium': 'retail__light-lmedium',
   'light-medium': 'retail__light-medium',
   'light-xlarge': 'retail__light-xlarge',
   'light-xxlarge': 'retail__light-xxlarge'
};

const list = {
   Controls: {_all: true}
};

function noCompatibleName(iModule: string, theme: string): boolean {
   let res = false;
   if (list[iModule] && (list[iModule]._all || list[iModule][theme])) {
      res = true;
   }
   return res;
}

interface ILinkInfo {
   moduleName: string;
   relative: boolean;
   resourceRoot: string;
   extension: string;
   needTheme: boolean;
   theme: string;
   isVdomSuperbundle: boolean;
   isPackage: boolean;
}

class LinkResolver {
   buildNumber: string;
   resourceRoot: string;
   originResourceRoot: string;
   paths: any;
   resourceRootTemplated: boolean = false;

   constructor(_isDebug: boolean, buildNumber: any, wsRoot: any, appRoot: any, resourceRoot: any) {
      this.buildNumber = buildNumber || '';
      let fullResourcePath = '';

      if (appRoot && !(resourceRoot && resourceRoot.indexOf(appRoot) !== -1)) {
         fullResourcePath += '/' + appRoot + '/';
      }
      if (resourceRoot) {
         fullResourcePath += '/' + resourceRoot + '/';
      }
      this.resourceRoot = ('/' + fullResourcePath).replace(/[\/]+/g, '/');
      this.originResourceRoot = resourceRoot;
      if (resourceRoot.indexOf('%') !== -1) {
         this.resourceRootTemplated = true;
      }
      this.initPaths();
   }

   initPathsServerSide(): void {
      const paths = createRequireRoutes();
      this.paths = paths;
   }

   getConstantsModulesInfo(): any {
      if (constants.modules) {
         return constants.modules;
      } else {
         return {};
      }
   }

   hasServicePath(imodule: string): boolean {
      const modulesInfo = this.getConstantsModulesInfo();
      if (modulesInfo && modulesInfo[imodule] && modulesInfo[imodule].path) {
         return true;
      } else {
         return false;
      }
   }

   getIModuleServicePath(imodule: string): string {
      const modulesInfo = this.getConstantsModulesInfo();
      return modulesInfo[imodule].path.split(imodule)[0];
   }

   initPaths(): void {
      this.paths = createRequireRoutes();
   }

   _getLinkResourceRoot(moduleName: string, imodule: string): string {
      let resourceRoot = this.resourceRoot;
      if (this.resourceRootTemplated) {
         resourceRoot = this.originResourceRoot;
      } else if (this.hasServicePath(imodule)) {
         resourceRoot = this.getIModuleServicePath(imodule);
      }
      return resourceRoot;
   }

   getIModule(moduleName: string): string {
      return moduleName.split('/')[0];
   }

   isAbsolute(path: string): boolean {
      return path.indexOf('/') === 0 ? true : false;
   }

   isPackage(path: string): boolean {
      return path.indexOf('.package') !== -1;
   }

   isMinified(path: string): boolean {
      return path.slice(-4) === '.min';
   }

   fixOld(name: string): string {
      let res = name;
      let replaceKey = '';
      const imodule = this.getIModule(name);
      if (this.paths[imodule] && res.indexOf(imodule) === 0) {
         replaceKey = imodule;
      }
      if (replaceKey.length && this.paths[replaceKey]) {
         res = res.replace(replaceKey, this.paths[replaceKey]);
      }
      return res;
   }

   /**
    * Trying to get theme name that is compatible with previous version of themes.
    * For example for theme "dark-large" it would be "retail__dark-large"
    * @param {string} themeName
    * @returns {string}
    */
   getThemeCompatibleName(themeName: string): string {
      if (newThemeMap.hasOwnProperty(themeName)) {
         return newThemeMap[themeName];
      }
      return themeName;
   }

   resolveLink(moduleName: string, linkInfo: any): string {
      if (typeof linkInfo === 'string') {
         linkInfo = {ext: linkInfo};
      }
      const fullConfig = this.generateFullConfig(moduleName, linkInfo);
      let link = this.getFullLink(fullConfig);
      link = this.postProcessing(link, fullConfig);
      return link;
   }

   resolveCssWithTheme(moduleName: string, theme: string): string {
      const iModule = this.getIModule(moduleName);
      const compatibleName = noCompatibleName(iModule, theme) ? theme : this.getThemeCompatibleName(theme);
      return this.resolvePathToCss(moduleName, compatibleName);
   }

   resolvePathToCss(moduleName: string, themeFull: string): string {
      const iModule: string = this.getIModule(moduleName);
      const splittedThemeName = themeFull.split('__');
      const theme = splittedThemeName[0];
      const modificator = splittedThemeName.length === 2 ? splittedThemeName[1] : null;
      const cssRelativePath = moduleName.split('/').splice(1).join('/');
      let cssPath: string;
      if (modificator) {
         cssPath = iModule + '-' +  theme + '-theme/' + modificator + '/' + cssRelativePath;
      } else {
         cssPath = iModule + '-' +  theme + '-theme/' + cssRelativePath;
      }
      return this.resolveLink(cssPath, {ext: 'css'});
   }

   getFullLink(linkInfo: ILinkInfo): string {
      return (linkInfo.resourceRoot ? linkInfo.resourceRoot : '')
         + linkInfo.moduleName
         + (linkInfo.needTheme ? '_' + linkInfo.theme : '')
         + ('.' + linkInfo.extension);
   }

   postProcessing(resultLink: string, linkInfo: ILinkInfo): string {
      let result = resultLink;
      if (linkInfo.theme && linkInfo.isPackage && !linkInfo.isVdomSuperbundle) {
         const splitted = resultLink.split('.package');
         splitted[0] = splitted[0] + '_' + linkInfo.theme;
         result = splitted.join('.package');
      }
      result = this.getResourceUrl(result);
      return result;
   }

   getResourceUrl(link: string): any {
      return getResourceUrl(link);
   }

   isNewTheme(moduleName: string, theme: string): boolean {
      const modulesInfo = this.getConstantsModulesInfo();
      const iModuleInfo = modulesInfo[this.getIModule(moduleName)];
      const fixedThemeName = theme.replace('__', ':');
      if (iModuleInfo && iModuleInfo.newThemes &&  iModuleInfo.newThemes[moduleName]) {
         return iModuleInfo.newThemes[moduleName].indexOf(fixedThemeName) !== -1;
      }
      return false;
   }

   isVdomSuperbundle(moduleName: string): boolean {
      if (moduleName.indexOf('vdom-superbundle') !== -1) {
         return true;
      }
      return false;
   }

   generateFullConfig(moduleName: string, linkConfig: any): ILinkInfo {
      let resourceRoot;
      const isAbsolute = this.isAbsolute(moduleName);
      const imodule = this.getIModule(moduleName);
      if (!isAbsolute) {
         resourceRoot = this._getLinkResourceRoot(moduleName, imodule);
      }
      const isPackage = this.isPackage(moduleName);
      const needTheme = linkConfig.theme && linkConfig.ext === 'css' && !isPackage;
      const oldFixed = this.fixOld(moduleName);
      const isVdomSuperbundle = this.isVdomSuperbundle(moduleName);
      return {
         moduleName: oldFixed,
         relative: !isAbsolute,
         resourceRoot,
         extension: linkConfig.ext,
         needTheme,
         theme: linkConfig.theme,
         isVdomSuperbundle,
         isPackage
      };
   }
}

export default LinkResolver;
