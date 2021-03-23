/// <amd-module name="UI/_base/HTML/JsLinks" />

import Control, { TemplateFunction } from 'UICore/Base';

// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/HTML/JsLinks');
import { headDataStore } from 'UI/Deps';
import { IControlOptions } from 'UI/Base';
import * as ModulesLoader from 'WasabyLoader/ModulesLoader';
import { cookie } from "Env/Env";

interface IJsLinksOptions extends IControlOptions {
   resourceRoot: string;
}
/**
 * Компонент для вставки ссылок на ресурсы страницы
 */
class JsLinks extends Control<IJsLinksOptions> {
   _template: TemplateFunction = template;

   js: Record<string, number> = {};
   tmpl: string[] = [];
   wml: string[] = [];
   themedCss: string[] = [];
   simpleCss: string[] = [];
   rsSerialized: string = '';
   rtpackModuleNames: string = '';

   _beforeMount(options: IJsLinksOptions): Promise<void> {
      if (typeof window !== 'undefined') {
         return;
      }
      return headDataStore.read('waitAppContent')().then((res) => {
         const jsLinks: string[] = res.js.map((js) => this.resolveLink(js)).concat(res.scripts);
         this.js = arrayToObject(jsLinks); // конвертируем в hashmap чтобы избавиться от дублей
         this.tmpl = res.tmpl;
         this.wml = res.wml;
         this.rsSerialized = res.rsSerialized;
         /**
          * На страницах OnlineSbisRu/CompatibleTemplate зависимости пакуются в rt-пакеты и собираются DepsCollector
          * Поэтому в глобальной переменной храним имена запакованных в rt-пакет модулей
          * И игнорируем попытки require (см. WS.Core\ext\requirejs\plugins\preload.js)
          * https://online.sbis.ru/opendoc.html?guid=348beb13-7b57-4257-b8b8-c5393bee13bd
          * TODO следует избавится при отказе от rt-паковки
          */
         this.rtpackModuleNames = JSON.stringify(arrayToObject(res.rtpackModuleNames));
      });
   }

   resolveLink(path: string, type: string = ''): string {
      return ModulesLoader.getModuleUrl(type ? `${type}!${path}` : path, cookie.get('s3debug'));
   }
}

export default JsLinks;

/** Конвертируем в hashmap для быстрого поиска имени модуля */
function arrayToObject(arr: string[]): Record<string, number> {
   const obj: Record<string, number> = {};
   let index = 0;
   for (const key of arr) {
      obj[key] = index++;
   }
   return obj;
}
