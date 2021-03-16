/// <amd-module name="UI/_deps/DependenciesPlaceholder" />

import { ICollectedDeps } from "UI/_base/DepsCollector";
import { EMPTY_THEME, getThemeController, THEME_TYPE } from "UI/theme/controller";
import { getResourceUrl } from 'UI/Utils';
import { headDataStore } from 'UI/Base';
import { JSLinks as AppJSLinks } from 'Application/Page';
import { handlePrefetchModules } from 'UI/_base/HTML/PrefetchLinks';
import { IHTMLOptions } from '../_base/interface/IHTML';
import { IRootTemplateOptions } from '../_base/interface/IRootTemplate';

interface IOptions extends IHTMLOptions, IRootTemplateOptions {};

/**
 * Заполняем JSLinks AI базовыми JS зависимостями для страницы.
 * В UI/_base/HTML есть beforeScripts. Царский поиск не дал результатов использования, поэтому поведение исчезло.
 * @param cfg - конфиг для страницы.
 */
function addBaseScripts(cfg: IOptions): void {
   const  API = AppJSLinks.getInstance(BASE_DEPS_NAMESPACE);
   const scripts = {
      bundles: 'bundles',
      require: 'cdn/RequireJS/2.3.5-p5/require-min',
      contents: 'contents',
      router: 'router',
      config: 'RequireJsLoader/config'
   };
   let rawUrl: string;

   for (const scriptsKey in scripts) {
      if (scripts.hasOwnProperty(scriptsKey)) {
         if (scriptsKey === 'config' && !cfg.builder) {
            continue;
         }
         rawUrl = `${scripts[scriptsKey]}.js`;

         API.createTag('script', {
            type: 'text/javascript',
            key: scriptsKey,
            src: rawUrl.startsWith('/') ? rawUrl : getResourceUrl(cfg.resourceRoot + rawUrl)
         });
      }
   }
}

export function aggregateCSS(theme: string, styles: string[] = [], themes: string[] = []): Promise<string> {
   const tc = getThemeController();
   const gettingStyles = styles.filter((name) => !!name).map((name) => tc.get(name, EMPTY_THEME));
   const gettingThemes = themes.filter((name) => !!name).map((name) => tc.get(name, theme, THEME_TYPE.SINGLE));
   return Promise.all(gettingStyles.concat(gettingThemes)).then();
}

/** Пространство имен для хранения базовых зависимостей страницы. Их важно указывать первыми. */
export const BASE_DEPS_NAMESPACE: string = 'baseDeps';

export function aggregateDependencies(cfg: IOptions): void {
   const deps = headDataStore.read('collectDependencies')();

   handlePrefetchModules(deps.js);
   addBaseScripts(cfg);
   aggregateCSS(cfg.theme, deps.css.simpleCss, deps.css.themedCss);
}
