/// <amd-module name="UI/_head/wsConfig" />

import { Head as AppHead } from 'Application/Page';
import { getConfig } from 'Application/Env';
import { constants } from 'Env/Env';
import { AppData } from 'UI/State';
import * as AppEnv from 'Application/Env';
import { IHeadOptions } from 'UI/_head/Interface';

/**
 * Подготовка когфига, который прилетит с сервака на клиент
 * wsConfig нет смысла рендерить на клиенте.
 * Он обязательно должен прийти с сервера.
 * Потому что необходим для загрузки ресурсов
 * очень много параметров имеют альтернативные источники. Взято из UI/_base/HTML
 */
export function createWsConfig(cfg: IHeadOptions): void {
   if (constants.isBrowserPlatform) {
      return;
   }

   const API = AppHead.getInstance();
   const appData = AppData.getAppData();
   let staticDomains: string;

   staticDomains = getStaticDomains(cfg);
   const defaultServiceUrl = cfg.servicesPath || appData.servicesPath || constants.defaultServiceUrl || '/service/';
   // @ts-ignore
   const product = cfg.product || appData.product || constants.product;
   const buildnumber = cfg.buildnumber || constants.buildnumber;
   let preInitScript = cfg.preInitScript ? cfg.preInitScript : '';
   const errorMonitoringScript = AppEnv.getStore('ErrorMonitoringScript') || '';
   /** В случае, если в хранилище ничего нет, придет деволтный IStore, а мы хотим все-же строку. */
   if (typeof errorMonitoringScript === 'string') {
      preInitScript += errorMonitoringScript;
   }

   API.createTag('script', {type: 'text/javascript'},
      [
         'var cfg = window.wsConfig = window.wsConfig || {};',
         `cfg.wsRoot = cfg.wsRoot || '${cfg.wsRoot || appData.wsRoot || constants.wsRoot}';`,
         `cfg.resourceRoot = cfg.resourceRoot || '${cfg.resourceRoot || constants.resourceRoot}';`,
         `cfg.defaultServiceUrl = cfg.defaultServiceUrl || '${defaultServiceUrl}';`,
         `cfg.appRoot = '${cfg.appRoot || appData.appRoot || constants.appRoot}';`,
         `cfg.RUMEnabled = ${cfg.RUMEnabled || appData.RUMEnabled || false};`,
         `cfg.pageName = '${cfg.pageName || appData.pageName || ''}';`,
         'cfg.userConfigSupport = true;',
         'cfg.trackErrors = true;',
         `cfg.staticDomains = ${staticDomains};`,
         'cfg.compatible = false;',
         `cfg.product = '${product}';`,
         buildnumber ? `window.buildnumber = '${buildnumber}';` : '',
         `window['X-UNIQ-ID'] = '${getConfig('X-UNIQ-ID') || ''}';`,
         `window['X-REQUESTUUID'] = '${getConfig('X-REQUESTUUID') || ''}';`,
         `window['X-CURRENTMETHOD'] = '${getConfig('X-CURRENTMETHOD') || ''}';`,
         preInitScript ? preInitScript : ''
      ].join('\n')
   );
}

function getStaticDomains(cfg: IHeadOptions): string {
   const appData = AppData.getAppData();
   let staticDomains: string;

   // @ts-ignore
   staticDomains = cfg.staticDomains || appData.staticDomains || constants.staticDomains || '[]';
   if (typeof staticDomains !== 'string') {
      staticDomains = '[]';
   }
   /** Написано Д. Зуевым в 2019 году. Просто перенес при реструктуризации. */
   if (typeof cfg.staticDomains === 'string') {
      staticDomains = cfg.staticDomains;
   }
   if (cfg.staticDomains instanceof Array) {
      staticDomains = JSON.stringify(cfg.staticDomains);
   }

   return staticDomains;
}
