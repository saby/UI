/// <amd-module name="UI/_base/HeadData" />
// @ts-ignore
import ThemesController = require('Core/Themes/ThemesController');
// @ts-ignore
import { cookie } from 'Env/Env';
// @ts-ignore
import DepsCollector from './DepsCollector';

import * as Request from 'View/Request';

function cropSlash(str) {
   let res = str;
   res = res.replace(/\/+$/, '');
   res = res.replace(/^\/+/, '');
   return res;
}

function joinPaths(arr) {
   let arrRes = [];
   for (let i = 0; i < arr.length; i++) {
      arrRes.push(cropSlash(arr[i]));
   }
   return arrRes.join('/');
}

let bundles, modDeps, contents;

// Need these try-catch because:
// 1. We don't need to load these files on client
// 2. We don't have another way to check if these files exists on server
try {
   // TODO https://online.sbis.ru/opendoc.html?guid=7e096cc5-d95a-48b9-8b71-2a719bd9886f
   // Need to fix this, to remove hardcoded paths
   modDeps = require('json!resources/module-dependencies');
} catch (e) {
}
try {
   contents = require('json!resources/contents');
} catch (e) {
}
try {
   bundles = require('json!resources/bundlesRoute');
} catch (e) {
}

bundles = bundles || {};
modDeps = modDeps || { links: {}, nodes: {} };
contents = contents || {};



class HeadData {

   private depComponentsMap: any = {};
   private additionalDeps: any = {};
   private waiterDef: Promise<any> = null;
   private isDebug: Boolean = false;

   // переедет в константы реквеста, изменяется в Controls/Application
   private isNewEnvironment: Boolean = false;

   private resolve: Function = null;
   private renderPromise: Promise<any> = null;

   constructor() {
      this.renderPromise = new Promise((resolve) => {
         this.resolve = resolve;
      });

      this.depComponentsMap = {};
      this.additionalDeps = {};
      this.isDebug = cookie.get('s3debug') === 'true' || contents.buildMode === 'debug';
   }

   /* toDO: StateRec.register */
   public pushDepComponent(componentName, needRequire) {
      this.depComponentsMap[componentName] = true;
      if (needRequire) {
         this.additionalDeps[componentName] = true;
      }
   }

   public pushWaiterDeferred(def: Promise<any>): void {
      let depsCollector = new DepsCollector(modDeps.links, modDeps.nodes, bundles, true);
      this.waiterDef = def;
      this.waiterDef.then(() => {
         if (!this.resolve) {
            return;
         }
         let components = Object.keys(this.depComponentsMap);
         let files = {};
         if (this.isDebug) {
            files = {};
         } else {
            files = depsCollector.collectDependencies(components);
            ThemesController.getInstance().initCss({
               themedCss: files.css.themedCss,
               simpleCss: files.css.simpleCss
            });
         }

         let rcsData = Request.getCurrent().stateReceiver.serialize();
         let additionalDepsArray = [];
         for (var key in rcsData.additionalDeps) {
            if (rcsData.additionalDeps.hasOwnProperty(key)) {
               additionalDepsArray.push(key);
            }
         }

         // Костыль. Чтобы сериализовать receivedState, нужно собрать зависимости, т.к. в receivedState у компонента
         // Application сейчас будет список css, для восстановления состояния с сервера.
         // Но собирать зависимости нам нужно после receivedState, потому что в нем могут тоже могут быть зависимости
         var additionalDeps = depsCollector.collectDependencies(additionalDepsArray);

         files.js = files.js || [];
         if (!this.isDebug) {
            for (let i = 0; i < additionalDeps.js.length; i++) {
               if (!~files.js.indexOf(additionalDeps.js[i])) {
                  files.js.push(additionalDeps.js[i]);
               }
            }
         }
         this.resolve({
            js: files.js || [],
            tmpl: files.tmpl || [],
            css: files.css || { themedCss: [], simpleCss: [] },
            errorState: this.err,
            receivedStateArr: rcsData.serialized,
            additionalDeps: Object.keys(rcsData.additionalDeps).concat(Object.keys(this.additionalDeps))
         });
         this.resolve = null;

      });
   }

   public waitAppContent():Promise<any> {
      return this.renderPromise;
   }

   public resetRenderDeferred(): void {
      this.renderPromise = new Promise((resolve) => {
         this.resolve = resolve;
      });
   }
}

export default HeadData;
