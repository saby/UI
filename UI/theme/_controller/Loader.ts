/// <amd-module name='UI/theme/_controller/Loader' />
// @ts-ignore
import LinkResolver from "./_controller/LinkResolver";
// @ts-ignore
import { constants } from 'Env/Env';
import { EMPTY_THEME } from './css/const';
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
         return this.lr.resolveLink(name, { ext: 'css' });
      }
      return this.lr.resolveCssWithTheme(name, theme);
   }
}
export interface ICssLoader {
   getHref(name: string, theme?: string): string;
}
