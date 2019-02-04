/// <amd-module name="UI/_base/Document" />

import Control from './Control';


// @ts-ignore
import template = require('wml!UI/_base/Document/Document');

// @ts-ignore
import ThemesController = require('Core/Themes/ThemesController');

import HeadData from './HeadData';
import StateReceiver from './StateReceiver';
import AppData from './Deprecated/AppData';

import * as Request from 'View/Request';
import createDefault from 'View/_Request/createDefault';

class Document extends Control {
   public _template: Function = template;

   private ctxData: any = null;
   private application: string = '';
   private applicationForChange: string = '';

   private coreTheme: string = '';

   constructor(cfg: any) {
      super(cfg);

      if (typeof window === 'undefined') {

         //need create request for SSR
         //on client request will create in app-init.js
         var req = new Request(createDefault(Request));
         req.setStateReceiver(new StateReceiver());
         if (typeof window !== 'undefined' && window.receivedStates) {
            req.stateReceiver.deserialize(window.receivedStates);
         }
         Request.setCurrent(req);
      }

      var headData = new HeadData();
      Request.getCurrent().setStorage('HeadData', headData);

      Request.getCurrent().setStorage('CoreInstance', { instance: this });
      this.ctxData = new AppData(cfg);
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

   public _getChildContext() {
      return {
         AppData: this.ctxData
      };
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
         var headData = Request.getCurrent().getStorage('HeadData');
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
