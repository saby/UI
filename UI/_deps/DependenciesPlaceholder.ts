/// <amd-module name="UI/_deps/DependenciesPlaceholder" />

import { cookie } from "Env/Env";
import { EMPTY_THEME, getThemeController, THEME_TYPE } from "UI/theme/controller";
import { getResourceUrl } from 'UI/Utils';
import { JSLinks as AppJSLinks } from 'Application/Page';
import { handlePrefetchModules } from './PrefetchLinks';
import * as ModulesLoader from 'WasabyLoader/ModulesLoader';

import { IHTMLOptions } from '../_base/interface/IHTML';
import { IRootTemplateOptions } from '../_base/interface/IRootTemplate';
import { ICollectedDeps } from './HeadData';
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
      require: '/cdn/RequireJS/2.3.5-p5/require-min',
      contents: 'contents',
      router: 'router',
      config: 'RequireJsLoader/config'
   };
   let rawUrl: string;
   let src: string;

   for (const scriptsKey in scripts) {
      if (scripts.hasOwnProperty(scriptsKey)) {
         rawUrl = `${scripts[scriptsKey]}.js`;
         src = rawUrl.startsWith('/') ? rawUrl : getResourceUrl(cfg.resourceRoot + rawUrl);

         API.createTag('script', {
            type: 'text/javascript',
            key: scriptsKey,
            src
         });
      }
   }
}

function resolveLink(path: string, type: string = ''): string {
   return ModulesLoader.getModuleUrl(type ? `${type}!${path}` : path, cookie.get('s3debug'));
}
export const UTILS_SCRIPTS_NAMESPACE: string = 'utilScripts';
function addUtilScripts(): void {
   const API = AppJSLinks.getInstance(UTILS_SCRIPTS_NAMESPACE);
   API.createTag('script', {
      type: 'text/javascript',
      src: getResourceUrl('/cdn/Boomerang/v.0.0.2.js'),
      defer: 'defer'
   });
}
/**
 * Наполняем JSLinks API собранными зависимостями
 * @param deps
 */
export function aggregateJS(deps: ICollectedDeps): void {
   const  API = AppJSLinks.getInstance();

   filterJsDeps(deps.js, deps.scripts)
      .map((js) => resolveLink(js))
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

   API.createTag(
      'script',
      { type: 'text/javascript' },
      `window['receivedStates']='${deps.rsSerialized}';`
   );
   /**
    * На страницах OnlineSbisRu/CompatibleTemplate зависимости пакуются в rt-пакеты и собираются DepsCollector
    * Поэтому в глобальной переменной храним имена запакованных в rt-пакет модулей
    * И игнорируем попытки require (см. WS.Core\ext\requirejs\plugins\preload.js)
    * https://online.sbis.ru/opendoc.html?guid=348beb13-7b57-4257-b8b8-c5393bee13bd
    * TODO следует избавится при отказе от rt-паковки
    */
   API.createTag(
      'script',
      { type: 'text/javascript' },
      `window['rtpackModuleNames']='${JSON.stringify(arrayToObject(deps.rtpackModuleNames))}';`
   );
}

/**
 * Удаление из списка с JS зависисмостями словари локализации, 
 * которые уже будут присутствовать в пакете rtpack, сформированном Сервисом Представления
 * @param jsDeps список зависимостей страницы, которые вычислил UI/Deps:DepsCollector
 * @param scripts список скриптов, которые пришли из СП как зависимости страницы
 * @TODO Этот код будет вынесен в middleware код приложения 
 * по задаче https://online.sbis.ru/opendoc.html?guid=0331640b-df1a-4903-9cb1-3bad0077b012
 */
function filterJsDeps(jsDeps: string[], scripts: string[]): string[] {
   if (!scripts) {
      return jsDeps;
   }
   const rtpackScripts: string[] = scripts.filter((item) => item.includes('/rtpack/'));
   if (!rtpackScripts.length) {
      return jsDeps;
   }
   return jsDeps.filter((js) => !js.includes('/lang/'));
}

/** Конвертируем в hashmap для быстрого поиска имени модуля */
function arrayToObject(arr: string[]): Record<string, number> {
   const obj: Record<string, number> = {};
   let index = 0;
   for (const key of arr) {
      obj[key] = index++;
   }
   return obj;
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
   addUtilScripts();
   aggregateJS(deps);

   return deps;
}

