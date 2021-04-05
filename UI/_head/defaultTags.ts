/// <amd-module name="UI/_head/defaultTags" />

import { Head as AppHead } from 'Application/Page';
import { JML } from 'Application/Interface';
import { getResourceUrl } from "UI/Utils";

import { IHTMLOptions } from '../_base/interface/IHTML';
import { IRootTemplateOptions } from '../_base/interface/IRootTemplate';

export interface IHeadOptions extends IHTMLOptions, IRootTemplateOptions {
   defaultTheme?: string;
   theme?: string;
   noscript?: string;
   preInitScript?: string;
   reactApp?: boolean;
   pageName?: string;
   RUMEnabled?: boolean;
   meta?: Object[];
   links?: Object[];
   scripts?: Object[];
}

export function createTitle(title: string): void {
   const API = AppHead.getInstance();
   const titleTag = API.getTag('title');
   if (!titleTag) {
      API.createTag('title', {}, title);
   }
}

export function createDefaultTags(cfg: IHeadOptions): void {
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
// tslint:disable-next-line: no-any
const prepareMetaScriptsAndLinks = (tag: string, attrs?: object): any => {
   return {
      tag,
      attrs
   };
};
/**
 * Применим опции meta, scripts и links к странице
 * @param cfg
 */
export function createMetaScriptsAndLinks(cfg: IHeadOptions): void {
   const API = AppHead.getInstance();
   []
      .concat((cfg.meta || []).map(prepareMetaScriptsAndLinks('meta')))
      .concat((cfg.scripts || []).map(prepareMetaScriptsAndLinks('script')))
      .concat((cfg.links || []).map(prepareMetaScriptsAndLinks('link')))
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
   if (!json || !(json instanceof Array)) {
      return;
   }

   /** В реалиях построения от шаблона, придется это гонять через Head API */
   const API = AppHead.getInstance();
   json.forEach((data) => {
      const tag = data[0];
      const attrs = typeof data[1] === 'object' ? data[1] : null;
      const content = typeof data[1] === 'string' ? data[1] : null;
      // @ts-ignore
      API.createTag(tag, attrs || {}, content);
   });
}

