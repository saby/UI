/// <amd-module name="UI/_head/wsConfig" />

import { Head as AppHead } from 'Application/Page';
import { constants } from "Env/Env";
import AppData from "UI/_base/AppData";

interface IWSConfig {
   staticDomains: string | string[];
   builder: boolean;
   preInitScript: string;
   buildnumber: string;
   reactApp?: boolean;
   product: string;
   compat: boolean;
   servicesPath: string;
   pageName: string;
   RUMEnabled: boolean;
   appRoot: string;
   resourceRoot: string;
   wsRoot: string;
}

/**
 * Подготовка когфига, который прилетит с сервака на клиент
 * wsConfig нет смысла рендерить на клиенте.
 * Он обязательно должен прийти с сервера.
 * Потому что необходим для загрузки ресурсов
 * очень много параметров имеют альтернативные источники. Взято из UI/_base/HTML
 */
export function createWsConfig(cfg: IWSConfig, initialStaticDomains: string): void {
   if (constants.isBrowserPlatform) {
      return;
   }

   const API = AppHead.getInstance();
   const appData = AppData.getAppData();
   let staticDomains: string = initialStaticDomains;

   // @ts-ignore
   staticDomains = cfg.staticDomains || appData.staticDomains || constants.staticDomains || '[]';
   if (typeof staticDomains !== 'string') {
      staticDomains = '[]';
   }
   const defaultServiceUrl = cfg.servicesPath || appData.servicesPath || constants.defaultServiceUrl || '/service/';
   // @ts-ignore
   const product = cfg.product || appData.product || constants.product;

   API.createTag('script', {type: 'text/javascript'},
      [
         'window.wsConfig = {',
            `wsRoot: '${cfg.wsRoot || appData.wsRoot || constants.wsRoot}',`,
            `resourceRoot: '${cfg.resourceRoot || constants.resourceRoot}',`,
            `appRoot: '${cfg.appRoot || appData.appRoot || (cfg.builder ? '/' : constants.appRoot)}',`,
            `RUMEnabled: ${cfg.RUMEnabled || appData.RUMEnabled || false},`,
            `pageName: '${cfg.pageName || appData.pageName || ''}',`,
            'userConfigSupport: true,',
            `staticDomains: ${staticDomains},`,
            `defaultServiceUrl: '${defaultServiceUrl}',`,
            `compatible: ${cfg.compat},`,
            `product: '${product}',`,
            `reactApp: ${cfg.reactApp || false}`,
         '};',
         cfg.buildnumber ? `window.buildnumber = '${cfg.buildnumber || constants.buildnumber}';` : '',
         cfg.preInitScript ? cfg.preInitScript : ''
      ].join('\n')
   );
}
