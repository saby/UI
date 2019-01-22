/// <amd-module name="UI/_base/HTML" />

import Control from './Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/HTML');
// @ts-ignore
import constants = require('Core/constants');
// @ts-ignore
import ThemesController = require('Core/Themes/ThemesController');
// @ts-ignore
import LinkResolver = require('Core/LinkResolver/LinkResolver');

import * as Request from 'View/Request';
import AppData from './Deprecated/AppData';

class HTML extends Control {
   public _template: Function = template;

   private onServer: Boolean = false;
   private isCompatible: Boolean = false;
   private compat: Boolean = false;
   private RUMEnabled: Boolean = false;
   private pageName: string = '';

   private title: string = '';
   private templateConfig: any = null;
   private buildnumber: string = '';
   private appRoot: string = '';
   private staticDomains: string = '[]';
   private wsRoot: string = '';
   private resourceRoot: string = '';
   private servicesPath: string = '';
   private application: string = '';
   private product: string = '';
   private linkResolver: any = null;

   static contextTypes() {
      return {
         AppData: AppData
      };
   }

   private initState(cfg): void {
      this.title = cfg.title;
      this.templateConfig = cfg.templateConfig;
      this.compat = cfg.compat || false;
   }

   public _beforeMount(cfg, context, receivedState):Promise<any> {
      this.onServer = typeof window === 'undefined';
      this.isCompatible = cfg.compat;
      this.initState(receivedState || cfg);
      if (!receivedState) {
         receivedState = {};
      }

      this.buildnumber = cfg.buildnumber || constants.buildnumber;

      this.appRoot = cfg.appRoot || context.AppData.appRoot || (cfg.builder ? '/' : constants.appRoot);

      this.RUMEnabled = cfg.RUMEnabled || context.AppData.RUMEnabled || false;
      this.pageName = cfg.pageName || context.AppData.pageName || false;

      this.staticDomains = cfg.staticDomains || context.AppData.staticDomains || constants.staticDomains || '[]';
      if (typeof this.staticDomains !== 'string') {
         this.staticDomains = '[]';
      }

      this.wsRoot = cfg.wsRoot || constants.wsRoot;
      this.resourceRoot = cfg.resourceRoot || constants.resourceRoot;
      this.product = cfg.product || constants.product;

      // TODO нужно удалить после решения https://online.sbis.ru/opendoc.html?guid=a9ceff55-1c8b-4238-90a7-22dde0e1bdbe
      this.servicesPath = (context.AppData ? context.AppData.servicesPath : cfg.servicesPath) || constants.defaultServiceUrl || '/service/';
      this.application = context.AppData.application;

      if (typeof window === 'undefined' && cfg.theme !== 'default') {
         ThemesController.getInstance().themes = {};
         ThemesController.getInstance().setTheme(cfg.theme);
      }
      var headData = Request.getCurrent().getStorage('HeadData');

      this.linkResolver = new LinkResolver(headData.isDebug,
         this.buildnumber,
         this.wsRoot,
         this.appRoot,
         this.resourceRoot);

      // LinkResolver.getInstance().init(context.headData.isDebug, self.buildnumber, self.appRoot, self.resourceRoot);

      headData.pushDepComponent(this.application, false);

      // Временно положим это в HeadData, потом это переедет в константы реквеста
      headData.isNewEnvironment = !this.isCompatible;

      if (receivedState.csses && !headData.isDebug) {
         ThemesController.getInstance().initCss({
            themedCss: receivedState.csses.themedCss,
            simpleCss: receivedState.csses.simpleCss
         });
      }

      /**
       * Этот перфоманс нужен, для сохранения состояния с сервера, то есть, cfg - это конфиг, который нам прийдет из файла
       * роутинга и с ним же надо восстанавливаться на клиенте.
       */
      return new Promise((resolve) => {
         resolve({
            buildnumber: this.buildnumber,
            csses: ThemesController.getInstance().getCss(),
            title: this.title,
            appRoot: this.appRoot,
            staticDomains: this.staticDomains,
            RUMEnabled: this.RUMEnabled,
            pageName: this.pageName,
            wsRoot: this.wsRoot,
            resourceRoot: this.resourceRoot,
            templateConfig: this.templateConfig,
            servicesPath: this.servicesPath,
            compat: this.compat,
            product: this.product
         });
      });
   }
}

export default HTML;
