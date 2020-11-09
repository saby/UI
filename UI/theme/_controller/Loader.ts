/// <amd-module name='UI/theme/_controller/Loader' />
// @ts-ignore
import LinkResolver from "./LinkResolver";
// @ts-ignore
import { constants } from 'Env/Env';
import { EMPTY_THEME, CSS_MODULE_PREFIX } from './css/const';
import { ModulesLoader } from 'UI/Utils';
type IConfig = {
   buildnumber: string,
   wsRoot: string,
   appRoot: string,
   resourceRoot: string;
};
export default class Loader implements ICssLoader {
   // TODO избавиться от LinkResolver, разрешать путь самостоятельно
   lr: LinkResolver;

   constructor (isDebug: boolean = false) {
      const { buildnumber, wsRoot, appRoot, resourceRoot } = constants as IConfig;
      if (constants.isServerSide) {
         this.lr = new LinkResolver(isDebug, buildnumber, wsRoot, appRoot, resourceRoot);
         return;
      }
      // на клиенте require css! иногда начинается раньше инициализации core-init, поэтому
      // смотрим сразу wsConfig
      // TODO убрать после завершения проекта Единая точка старта приложения 
      // https://online.sbis.ru/opendoc.html?guid=0f2cfb1c-d0b0-41dc-9fdc-c9fa004ac6d8
      const wsConfig: IConfig = window?.['wsConfig'] || {};
      this.lr = new LinkResolver(isDebug,
         wsConfig.buildnumber || buildnumber,
         wsConfig.wsRoot || wsRoot,
         wsConfig.appRoot || appRoot,
         wsConfig.resourceRoot || resourceRoot
      );
   }

   getHref(name: string, theme: string): string {
      if (name.indexOf('.css') !== -1) {
         return name;
      }
      if (theme === EMPTY_THEME) {
         /**
          * Для стилей без темы лучше всего полагаться на свежий механизм Мальцева.
          * Он и минификацию и бандлы учтет
          * На серверной стороне есть проблемы. Оставлю пока как есть.
          * https://online.sbis.ru/opendoc.html?guid=62cf64e8-ecfa-47e4-b7b7-5e2a95bab01b
          */
         if (constants.isServerSide) {
            return this.lr.resolveLink(name, { ext: 'css' });
         }
         return ModulesLoader.getModuleUrl(CSS_MODULE_PREFIX + name);
      }
      return this.lr.resolveCssWithTheme(name, theme);
   }
}
export interface ICssLoader {
   getHref(name: string, theme?: string): string;
}
