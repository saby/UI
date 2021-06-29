/// <amd-module name='UICommon/_deps/PageDeps' />

import { cookie, constants } from 'Env/Env';
import { DepsCollector, ICollectedFiles, IDeps } from './DepsCollector';
import { IContents, getModulesDeps } from 'WasabyLoader/RecursiveWalker';

/**
 * constants.resourceRoot указан путь до корневой директории сервиса,
 * а нужен путь до продукта, который 'resources'
 * но в инт.тестах корень не 'resources', а именно constants.resourceRoot
 */
let root = 'resources';
let contents: Partial<IContents> = {};
try {
   // tslint:disable-next-line:ban-ts-ignore
   // @ts-ignore
   contents = require(`json!${root}/contents`) || {}; // tslint:disable-line:no-var-requires
} catch {
   try {
      root = constants.resourceRoot;
      // tslint:disable-next-line:ban-ts-ignore
      // @ts-ignore
      contents = require(`json!${root}contents`) || {}; // tslint:disable-line:no-var-requires
   } catch {
      contents = {};
   }
}
const { links, nodes, bundles } = getModulesDeps(contents.modules);
const depsCollector = new DepsCollector(links, nodes, bundles);

export default class PageDeps {
   isDebug: boolean;

   constructor() {
      this.isDebug = cookie.get('s3debug') === 'true' || contents.buildMode === 'debug';
   }

   collect(initDeps: IDeps = [], unpackRtPackDeps: IDeps): ICollectedFiles {
      if (this.isDebug) {
         return getDebugDeps(initDeps);
      }
      const unpack = getUnpackDepsFromCookie().concat(unpackRtPackDeps);
      return getRealeseDeps(initDeps, unpack);
   }
}

function getUnpackDepsFromCookie(): IDeps {
   /**
    * в s3debug может быть true или строка-перечисление имен непакуемых ресурсов
    * https://online.sbis.ru/opendoc.html?guid=1d5ab888-6f9e-4ee0-b0bd-12e788e60ed9
    */
   return cookie.get('s3debug')?.split?.(',') || [];
}

function getDebugDeps(initDeps: IDeps): ICollectedFiles {
   return {
      js: [],
      css: { themedCss: [], simpleCss: [] },
      tmpl: [],
      wml: []
   };
}

function getRealeseDeps(deps: IDeps, unpack: IDeps): ICollectedFiles {
   return depsCollector.collectDependencies(deps, unpack);
}
