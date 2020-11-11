/// <amd-module name="UI/_base/HTML/JsLinks" />

import Control, { TemplateFunction } from 'UI/_base/Control';

// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/HTML/JsLinks');
import { headDataStore } from 'UI/_base/HeadData';
import { IControlOptions } from 'UI/Base';
import { Head as HeadAPI } from "Application/Page";

interface IJsLinksOptions extends IControlOptions {
   linkResolver: {
      resolveLink(l: string, ext: string): string;
   };
}
/**
 * Компонент для вставки ссылок на ресурсы страницы
 */
class JsLinks extends Control<IJsLinksOptions> {
   // TODO: rmv
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
      const resolveJsLink = (js: string) => options.linkResolver.resolveLink(js, 'js');
      return headDataStore.read('waitAppContent')().then((res) => {
         const jsLinks: string[] = res.js.map(resolveJsLink).concat(res.scripts); // ready
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

         //TODO: проверить в правильном ли порядке происходит обработка ключей, значений и индексов. смотри в jslinks.wml
         //TODO: null в биндах
         [].concat(Object.keys(this.js).map(prepare.bind(null,'js')))
             .concat(this.wml.map(prepare.bind(null,'wml')))
             .concat(this.tmpl.map(prepare.bind(null,'tmpl')))
             .forEach(data => {
                HeadAPI.getInstance().createTag('script', {
                   type: "text/javascript",
                   defer: 'defer',
                   key: `scripts_${data.idx}`,
                   src: data.type === 'js' ? data.item : options.linkResolver.resolveLink(data.idx, data.type)
                });
             });

         // TODO: delete jslinks.wml
         this.rsSerialized && HeadAPI.getInstance().createTag('script', {}, `window['receivedStates']=${this.rsSerialized}';`);
         this.rtpackModuleNames && HeadAPI.getInstance().createTag('script', {},  `window['rtpackModuleNames'] = ${this.rtpackModuleNames}';`);
      });
   }
}

export default JsLinks;

/** подготавливаем аттрибуты в нужный нам вид для более удобной работы */
function prepare(type, item, idx){
   return {
      type: type,
      item: item,
      idx: idx
   }
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
