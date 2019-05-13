/// <amd-module name="UI/_base/Document" />

import Control from './Control';


// @ts-ignore
import template = require('wml!UI/_base/Document/Document');

// @ts-ignore
import ThemesController = require('Core/Themes/ThemesController');

import HeadData from './HeadData';
import StateReceiver from './StateReceiver';
import AppData from './Deprecated/AppData';

import { default as AppInit } from 'Application/Initializer';
import * as AppEnv from 'Application/Env';
// @ts-ignore
import { PresentationService } from 'SbisEnv/PresentationService';

class Document extends Control {
   public _template: Function = template;

   private ctxData: any = null;
   private application: string = '';
   private applicationForChange: string = '';

   private coreTheme: string = '';

   constructor(cfg: any) {
      super(cfg);

      var stateReceiverInst = new StateReceiver();
      var environmentFactory = undefined;
      if (typeof window === 'undefined') {
         environmentFactory = PresentationService;
      }

      if (!AppInit.isInit()) {
         var stateReceiverInst = new StateReceiver();
         var environmentFactory = undefined;
         if (typeof window === 'undefined') {
            environmentFactory = PresentationService.default;
         }
         AppInit.default(cfg, environmentFactory, stateReceiverInst);

         if (typeof window === 'undefined' || window.__hasRequest === undefined) {
            //need create request for SSR
            //on client request will create in app-init.js
            if (typeof window !== 'undefined' && window.receivedStates) {
               stateReceiverInst.deserialize(window.receivedStates);
            }
         }
      }

      var headData = new HeadData();
      AppEnv.setStore('HeadData', headData);

      AppData.initAppData(cfg);
      this.ctxData = new AppData.getAppData();
      
      AppEnv.setStore('CoreInstance', { instance: this });
   }

   public _beforeMount(cfg:any) {
      this.application = cfg.application;
   }

   public _beforeUpdate(cfg:any) {
      if (this.applicationForChange) {
         this.application = this.applicationForChange;
         this.applicationForChange = null;
      } else {
         this.application = cfg.application;
      }
   }

   public setTheme(ev: Event, theme: string) {
      this.coreTheme = theme;
      if (ThemesController.getInstance().setTheme) {
         ThemesController.getInstance().setTheme(theme);
      }
   }

   public changeApplicationHandler(e: Event, app: string): Boolean {
      let result;
      if (this.application !== app) {
         this.applicationForChange = app;
         var headData = AppEnv.getStore('HeadData');
         headData && headData.resetRenderDeferred();
         this._forceUpdate();
         result = true;
      } else {
         result = false;
      }
      return result;
   }

}

export default Document;
