/// <amd-module name="UI/_base/HTML/JsLinks" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/JsLinks');
import { headDataStore } from 'UI/_base/HeadData';

class JsLinks extends Control {
   // @ts-ignore
   _template: Function = template;

   js: string[] = [];
   tmpl: string[] = [];
   wml: string[] = [];
   themedCss: string[] = [];
   simpleCss: string[] = [];
   rsSerialized: string = '';
   rtpackModuleNames: string = '';
   _beforeMount() {
      if (typeof window !== 'undefined' && typeof process === 'undefined') {
         return;
      }
      return headDataStore.read('waitAppContent')().then((res) => {
         this.js = res.js;
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
}

export default JsLinks;

/** Конвертируем в hashmap для быстрого поиска имени модуля */
function arrayToObject(arr: string[]) {
   const obj: Record<string, number> = {};
   for (let key of arr) {
      obj[key] = 1;
   }
   return obj;
}