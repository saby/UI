/// <amd-module name="UI/_base/HTML/JsLinks" />

import { Control } from 'UICore/Base';
import { TemplateFunction } from 'UICommon/Base';

// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/HTML/JsLinks');
import { headDataStore } from 'UI/Deps';
import { IControlOptions } from 'UI/Base';
import * as ModulesLoader from 'WasabyLoader/ModulesLoader';
import { cookie } from "Env/Env";
import { JSLinks } from 'Application/Page';
import { default as TagMarkup } from 'UI/_base/HTML/_meta/TagMarkup';
import { fromJML } from 'UI/_base/HTML/_meta/JsonML';
import {aggregateJS} from 'UI/Deps';

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
         const jslinksAPI = JSLinks.getInstance();
         aggregateJS(res);
         const data = jslinksAPI.getData();
         if (data && data.length) {
            this.jslinksData += new TagMarkup(data.map(fromJML), { getResourceUrl: false }).outerHTML;
         }
      });
   }
}

export default JsLinks;