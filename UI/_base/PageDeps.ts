/// <amd-module name='UI/_base/PageDeps' />
import { cookie, constants } from 'Env/Env';
import { DepsCollector, ICollectedFiles, IDeps } from 'UI/_base/DepsCollector';
const root = 'resources';
let contents: Partial<IContents> = {};
try {
   // @ts-ignore tslint:disable-next-line:no-var-requires
   contents = require(`json!${root}/contents`) || {};
} catch {
   contents = {};
}

const noDescription: IModulesDescription = {
   bundles: {},
   nodes: {},
   links: {},
   packedLibraries: {},
   lessDependencies: {}
};

export default class PageDeps {
   isDebug: boolean;

   constructor() {
      this.isDebug = cookie.get('s3debug') === 'true' || contents.buildMode === 'debug';
   }

   collect(initDeps: IDeps = []): ICollectedFiles {
      return this.isDebug ? getDebugDeps() : getRealeseDeps(initDeps, getUnpackDeps());
   }
}

function getUnpackDeps(): IDeps {
   /**
    * в s3debug может быть true или строка-перечисление имен непакуемых ресурсов
    * https://online.sbis.ru/opendoc.html?guid=1d5ab888-6f9e-4ee0-b0bd-12e788e60ed9
    */
   return cookie.get('s3debug')?.split?.(',') || [];
}

function getDebugDeps(): ICollectedFiles {
   return {
      js: [],
      css: { themedCss: [], simpleCss: [] },
      tmpl: [],
      wml: []
   };
}

function getRealeseDeps(deps: IDeps, unpack: IDeps): ICollectedFiles {
   const { links, nodes, bundles } = getModulesDeps(contents.modules).reduce(collect);
   return new DepsCollector(links, nodes, bundles).collectDependencies(deps, unpack);
}

/**
 * Импорт module-dependencies.json текущего сервиса и всех внешних
 * для коллекции зависимостей на СП
 * @param modules - словарь используемых модулей, для которых собираются зависимости
 */
function getModulesDeps(modules: IModules = {}): IModulesDescription[] {
   if (constants.isBrowserPlatform) { return [noDescription]; }

   /** Список путей до внешних сервисов */
   const externalPaths = Object.keys(modules)
      .filter((name) => !!modules[name].path)
      .map((name) => modules[name].path);

   return [root, ...externalPaths]
      .map(requireModuleDeps);
}

function collect(prev: IModulesDescription, next: IModulesDescription): IModulesDescription {
   return {
      links: { ...prev.links, ...next.links },
      nodes: { ...prev.nodes, ...next.nodes },
      bundles: { ...prev.bundles, ...next.bundles },
      packedLibraries: { ...prev.packedLibraries, ...next.packedLibraries },
      lessDependencies: { ...prev.lessDependencies, ...next.lessDependencies }
   };
}

function requireModuleDeps(path: string): IModulesDescription {
   try {
      // @ts-ignore
      const deps: IModulesDeps = require(`json!${path}/module-dependencies`);
      // @ts-ignore
      const bundles: IBundlesRoute = require(`json!${path}/bundlesRoute`);
      return { ...deps, bundles };
   } catch {
      /** Ошибка игнорируется т.к module-dependencies может отсутствовать */
      return noDescription;
   }
}

interface IContents {
   buildMode: string;
   buildnumber: string;
   htmlNames: Record<string, string>;
   jsModules: object;
   modules: IModules;
}
interface IModules {
   [mod: string]: { path?: string; };
}
interface IModulesDeps {
   nodes: Record<string, { path: string, amd: boolean; }>;
   links: Record<string, IDeps>;
   packedLibraries: Record<string, IDeps>;
   lessDependencies: object;
}
type IBundlesRoute = Record<string, string>;

interface IModulesDescription extends IModulesDeps {
   bundles: IBundlesRoute;
}
