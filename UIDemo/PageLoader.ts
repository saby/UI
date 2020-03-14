/// <amd-module name="UIDemo/PageLoader" />

// @ts-ignore
import { Control, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!UIDemo/PageLoader');

class PageLoader extends Control {
   public _template: TemplateFunction = template;

   protected pageClassLoaded: Function = null;

   private changePage(newPage: String): Promise<void> {
      return new Promise((resolve, reject) => {
         // @ts-ignore
         require(['UIDemo/'+newPage], (newPageClass:Function) => {
            this.pageClassLoaded = newPageClass;
            resolve();
         })
      });
   };

   _beforeMount(cfg: any): Promise<void> {
      return this.changePage(cfg.pageId);
   };

   _beforeUpdate(newCfg: any): void {
      // @ts-ignore
      if (this._options.pageId !== newCfg.pageId) {
         this.changePage(newCfg.pageId).then(() => {
            // @ts-ignore
            this._forceUpdate();
         });
      }
   };
}

export = PageLoader;
