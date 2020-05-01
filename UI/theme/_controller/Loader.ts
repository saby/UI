/// <amd-module name='UI/theme/_controller/Loader' />
// @ts-ignore
import * as LinkResolver from 'Core/LinkResolver/LinkResolver';
// @ts-ignore
import { constants } from 'Env/Env';
import { EMPTY_THEME } from 'UI/theme/_controller/css/const';

export default class Loader implements ICssLoader {
   lr: LinkResolver;

   constructor(isDebug: boolean = false) {
      const { buildnumber, wsRoot, appRoot, resourceRoot } = constants;
      this.lr = new LinkResolver(isDebug, buildnumber, wsRoot, appRoot, resourceRoot);
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
