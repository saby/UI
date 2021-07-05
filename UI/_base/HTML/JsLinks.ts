/// <amd-module name="UI/_base/HTML/JsLinks" />

import { cookie } from 'Env/Env';
import { ICollectedDeps } from '../../../UICommon/_deps/Interface';
import { Control } from 'UICore/Base';
import { TemplateFunction } from 'UICommon/Base';

// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/HTML/JsLinks');
import { headDataStore } from 'UICommon/Deps';
import { IControlOptions } from 'UI/Base';
import { JSLinks as AppJSLinks } from 'Application/Page';
import { default as TagMarkup } from 'UI/_base/HTML/_meta/TagMarkup';
import { fromJML } from 'UI/_base/HTML/_meta/JsonML';
import * as ModulesLoader from 'WasabyLoader/ModulesLoader';

interface IJsLinksOptions extends IControlOptions {
   resourceRoot: string;
}
/**
 * Компонент для вставки ссылок на ресурсы страницы
 */
class JsLinks extends Control<IJsLinksOptions> {
   _template: TemplateFunction = template;

   jslinksData: String = '';

   _beforeMount(options: IJsLinksOptions): Promise<void> {
      if (typeof window !== 'undefined') {
         return;
      }
      return headDataStore.read('pageContentBuilded')().then((res) => {
         const jslinksAPI = AppJSLinks.getInstance();
         aggregateJS(res);
         const data = jslinksAPI.getData();
         if (data && data.length) {
            this.jslinksData += new TagMarkup(data.map(fromJML), { getResourceUrl: false }).outerHTML;
         }
      });
   }
}

export default JsLinks;

/**
 * *********************************************************************************************************************
 * Далее обозначен блок функций, которые должны умереть вместе с этим файлом.
 * Модуль DependenciesPlaceholder, в котором они были определены был реорганизован
 */

function resolveLink(path: string, type: string = ''): string {
   return ModulesLoader.getModuleUrl(type ? `${type}!${path}` : path, cookie.get('s3debug'));
}

/**
 * Удаление из списка с JS зависисмостями словари локализации,
 * которые уже будут присутствовать в пакете rtpack, сформированном Сервисом Представления
 * @param jsDeps список зависимостей страницы, которые вычислил UICommon/Deps:DepsCollector
 * @param scripts список скриптов, которые пришли из СП как зависимости страницы
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

/**
 * Наполняем JSLinks API собранными зависимостями
 * @param deps
 */
function aggregateJS(deps: ICollectedDeps): void {
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
