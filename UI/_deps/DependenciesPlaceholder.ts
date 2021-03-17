/// <amd-module name="UI/_deps/DependenciesPlaceholder" />

import { cookie } from "Env/Env";
import { EMPTY_THEME, getThemeController, THEME_TYPE } from "UI/theme/controller";
import { getResourceUrl } from 'UI/Utils';
import { JSLinks as AppJSLinks } from 'Application/Page';
import { handlePrefetchModules } from '../_base/HTML/PrefetchLinks';
import * as ModulesLoader from 'WasabyLoader/ModulesLoader';

import { IHTMLOptions } from '../_base/interface/IHTML';
import { IRootTemplateOptions } from '../_base/interface/IRootTemplate';
import { ICollectedDeps } from '../_base/HeadData';

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

function resolveLink(path: string, type: string = ''): string {
   return ModulesLoader.getModuleUrl(type ? `${type}!${path}` : path, cookie.get('s3debug'));
}

/**
 * Наполняем JSLinks API собранными зависимостями
 * @param deps
 */
export function aggregateJS(deps: ICollectedDeps): void {
   const  API = AppJSLinks.getInstance();

   deps.js.map((js) => this.resolveLink(js))
      .concat(deps.scripts)
      .concat(deps.tmpl.map((rawLink) => resolveLink(rawLink, 'tmpl')))
      .concat(deps.wml.map((rawLink) => resolveLink(rawLink, 'wml')))
      .forEach((link, i) => {
         API.createTag('script', {
            type: 'text/javascript',
            src: link,
            defer: 'defer',
            key: `scripts_${i}`
         });
      });

   ['rsSerialized', 'rtpackModuleNames'].forEach((key) => {
      if (deps[key]) {
         API.createTag(
            'script',
            { type: 'text/javascript' },
            `window['${key}']='${deps[key]}';`
         );
      }
   });
}

export function aggregateCSS(theme: string, styles: string[] = [], themes: string[] = []): Promise<string> {
   const tc = getThemeController();
   const gettingStyles = styles.filter((name) => !!name).map((name) => tc.get(name, EMPTY_THEME));
   const gettingThemes = themes.filter((name) => !!name).map((name) => tc.get(name, theme, THEME_TYPE.SINGLE));
   return Promise.all(gettingStyles.concat(gettingThemes)).then();
}

/** Пространство имен для хранения базовых зависимостей страницы. Их важно указывать первыми. */
export const BASE_DEPS_NAMESPACE: string = 'baseDeps';

export function aggregateDependencies(cfg: IOptions, deps: ICollectedDeps): ICollectedDeps {
   /**
    * Порядок следующий:
    * aggregateCSS - стили для страницы. Лежат в <head>.
    *    Пусть лучше страница потупит от запоздалых JS, чем будет дергаться от запоздалых CSS
    * handlePrefetchModules - добавляет в <head> ресурсы для предзагрузки. На основной поток не влияют.
    * addBaseScripts - базовые скрипты приложения. Их 5. Без них даже RequireJS не заведется
    * aggregateJS
    */
   aggregateCSS(cfg.theme, deps.css.simpleCss, deps.css.themedCss);
   handlePrefetchModules(deps.js);
   addBaseScripts(cfg);
   aggregateJS(deps);

   return deps;
}
