/// <amd-module name="UI/_head/defaultTags" />

import { Head as AppHead } from 'Application/Page';
import type { JML } from 'Application/Page';
import { getResourceUrl } from "UI/Utils";
import escapeHtml = require('Core/helpers/String/escapeHtml');

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
   AppHead.getInstance().createTag('title', {}, title);
}
export function createViewPort(): void {
   AppHead.getInstance().createTag('meta', {content: 'width=1024', name: 'viewport'});
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
   metaAttrs.forEach((attrs) => {
      // @ts-ignore
      API.createTag('meta', attrs);
   });
}
/**
 * Функция для подготовки данных
 * @param tag
 * @param attrs
 * @returns
 */
const prepareMetaScriptsAndLinks = (tag: string, attrs: object): object => {
   return {
      tag,
      attrs
   };
}
/**
 * Применим опции meta, scripts и links к странице
 * @param cfg
 */
export function createMetaScriptsAndLinks(cfg: IHeadOptions): void {
   const API = AppHead.getInstance();
   []
      .concat((cfg.meta || []).map((attr) => prepareMetaScriptsAndLinks('meta', attr)))
      .concat((cfg.scripts || []).map((attr) => prepareMetaScriptsAndLinks('script', attr)))
      .concat((cfg.links || []).map((attr) => prepareMetaScriptsAndLinks('link', attr)))
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
      let attrs = typeof data[1] === 'object' ? data[1] : null;
      const content = typeof data[1] === 'string' ? data[1] : null;

      if (!attrs) {
         attrs = {};
      }
      /** Раньше HeadJSON прогонялся напрямую через TagMarkup. Сейчас необходимо выполнить подготовку */
      for (const attrsKey in attrs) {
         if (attrs.hasOwnProperty(attrsKey)) {
            if (attrsKey === 'href' || attrsKey === 'src') {
               attrs[attrsKey] = getResourceUrl(attrs[attrsKey]);
               continue;
            }
            attrs[attrsKey] = escapeHtml(attrs[attrsKey]);
         }
      }

      // @ts-ignore
      API.createTag(tag, attrs, content);
   });
}

