/// <amd-module name="UI/_deps/DependenciesPlaceholder" />

import { ICollectedDeps } from "UI/_base/DepsCollector";
import { getResourceUrl } from 'UI/Utils';
import { JSLinks as AppJSLinks } from 'Application/Page';
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

function aggregateCSS(cfg: IOptions, deps: ICollectedDeps): void {
   return;
}

/** Пространство имен для хранения базовых зависимостей страницы. Их важно указывать первыми. */
export const BASE_DEPS_NAMESPACE: string = 'baseDeps';

export function aggregateDependencies(cfg: IOptions): void {
   addBaseScripts(cfg);
}
