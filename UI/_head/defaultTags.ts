/// <amd-module name="UI/_head/defaultTags" />

import { Head as AppHead } from 'Application/Page';
import { JML } from 'Application/Interface';
import { getResourceUrl } from "UI/Utils";

export interface IWSConfig {
   defaultTheme?: string;
   theme?: string;
   viewport?: string;
   noscript?: string;
   staticDomains?: string | string[];
   builder?: boolean;
   preInitScript?: string;
   buildnumber?: string;
   reactApp?: boolean;
   product?: string;
   compat?: boolean;
   servicesPath?: string;
   pageName?: string;
   RUMEnabled?: boolean;
   appRoot: string;
   resourceRoot: string;
   wsRoot: string;
   meta?: Object[];
   links?: Object[];
   scripts?: Object[];
}

export function createDefaultTags(cfg: IWSConfig): void {
   const API = AppHead.getInstance();

   if (!cfg.compat) {
      API.createTag('script', {type: 'text/javascript'},
         `window.themeName = '${cfg.theme || cfg.defaultTheme || ''}';`
      );
   }

   API.createNoScript(cfg.noscript);
   const metaAttrs = [
      {'http-equiv': 'X-UA-Compatible', content: 'IE=edge'},
      {charset: 'utf-8', class: 'head-server-block'}
   ];
   /** Возможно, кто-то уже добавил viewport */
   const viewPort = API.getTag('meta', {name: 'viewport'});
   /** Если не нашли тег, или если нашли очень много, добавим свой */
   if (!viewPort || (viewPort instanceof Array)) {
      // @ts-ignore
      metaAttrs.push({name: 'viewport', content: cfg.viewport || 'width=1024'});
   }
   metaAttrs.forEach((attrs) => {
      // @ts-ignore
      API.createTag('meta', attrs);
   });
}

/**
 * Применим опции meta, scripts и links к странице
 * @param cfg
 */
export function createMetaScriptsAndLinks(cfg: IWSConfig): void {
   const API = AppHead.getInstance();
   []
      .concat((cfg.meta || []).map(prepareMetaScriptsAndLinks.bind(null, 'meta')))
      .concat((cfg.scripts || []).map(prepareMetaScriptsAndLinks.bind(null, 'script')))
      .concat((cfg.links || []).map(prepareMetaScriptsAndLinks.bind(null, 'link')))
      .forEach((item: {tag: string, attrs: object}) => {
         ['href', 'src'].forEach((field) => {
            if (item.attrs[field]) {
               item.attrs[field] = getResourceUrl(item.attrs[field]);
            }
         });
         // @ts-ignore
         API.createTag(item.tag, item.attrs);
      });
}

/**
 * Поддержка старой опции
 * Запустил процесс отказа от нее
 * https://online.sbis.ru/opendoc.html?guid=fe14fe59-a564-4904-9a87-c38a5a22b924
 * @param options
 * @deprecated
 */
export function applyHeadJson(json: JML[]): void {
   /** В реалиях построения от шаблона, придется это гонять через Head API */
   const API = AppHead.getInstance();
   json.forEach((data) => {
      // @ts-ignore
      API.createTag(data[0], data[1]);
   });
}

function prepareMetaScriptsAndLinks(tag: string, attrs: object): object {
   return {
      tag,
      attrs
   };
}
