/// <amd-module name="UI/_base/HTML/JsLinks" />

import Control, { TemplateFunction } from 'UI/_base/Control';

// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/HTML/JsLinks');
import { headDataStore } from 'UI/_base/HeadData';
import { IControlOptions } from 'UI/Base';
import * as ModulesLoader from 'WasabyLoader/ModulesLoader';
import {default as JSLinks} from 'Application/_Page/JSLinks';
import { cookie } from "Env/Env";
import { default as TagMarkup } from 'UI/_base/HTML/_meta/TagMarkup';
import { fromJML } from 'UI/_base/HTML/_meta/JsonML';

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
      return headDataStore.read('waitAppContent')().then((res) => {
         let jslinksAPI = JSLinks.getInstance();
         const links: string[] = res.js.map((js) => this.resolveLink(js)).concat(res.scripts);

         if (this.arrayToObject(jsLinks)) {
            links.forEach((link, index) =>
               jslinksAPI.createTag('script', {
                  type: 'text/javascript',
                  src: link,
                  key: 'scripts_' + index,
                  defer: 'defer'
               }, ''));
         }
         if (res.tmpl) {
            res.tmpl.forEach((value, index) =>
               jslinksAPI.createTag('script', {
                  type: 'text/javascript',
                  src: this.resolveLink(value, 'tmpl'),
                  key: 'scripts_' + index,
                  defer: 'defer'
               }, ''));
         }
         if (res.wml) {
            res.tmpl.forEach((value, index) =>
               jslinksAPI.createTag('script', {
                  type: 'text/javascript',
                  src: this.resolveLink(value, 'wml'),
                  key: 'scripts_' + index,
                  defer: 'defer'
               }, ''));
         }

         if (res.rsSerialized) {
            jslinksAPI.createTag('script', { type: '' },
               `window['receivedStates']='${res.rsSerialized}';`);
         }
         /**
         * На страницах OnlineSbisRu/CompatibleTemplate зависимости пакуются в rt-пакеты и собираются DepsCollector
         * Поэтому в глобальной переменной храним имена запакованных в rt-пакет модулей
         * И игнорируем попытки require (см. WS.Core\ext\requirejs\plugins\preload.js)
         * https://online.sbis.ru/opendoc.html?guid=348beb13-7b57-4257-b8b8-c5393bee13bd
         * TODO следует избавится при отказе от rt-паковки
         */

         if (JSON.stringify(this.arrayToObject(res.rtpackModuleNames))) {
            jslinksAPI.createTag('script', { type: '' },
               `window['rtpackModuleNames']='${res.rtpackModuleNames}';`);
         }
         const data = jslinksAPI.getData();
         if (data && data.length) {
            this.jslinksData += new TagMarkup(data.map(fromJML), { getResourceUrl: false }).outerHTML;
         }
         jslinksAPI.clear();
      });
   }

   resolveLink(path: string, type: string = ''): string {
      return ModulesLoader.getModuleUrl(type ? `${type}!${path}` : path, cookie.get('s3debug'));
   }

   arrayToObject(arr: string[]): Record<string, number> {
      const obj: Record<string, number> = {};
      let index = 0;
      for (const key of arr) {
         obj[key] = index++;
      }
      return obj;
   }
}

export default JsLinks;