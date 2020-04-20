/// <amd-module name='UI/theme/_controller/Loader' />
// @ts-ignore
import * as LinkResolver from 'Core/LinkResolver/LinkResolver';
// @ts-ignore
import { constants } from 'Env/Env';
import { EMPTY_THEME, THEME_TYPE } from 'UI/theme/_controller/css/const';
// @ts-ignore
import { fetch } from 'Browser/Transport';
export default class Loader implements ICssLoader {
   lr: LinkResolver;

   constructor(isDebug: boolean = false) {
      const { buildnumber, wsRoot, appRoot, resourceRoot } = constants;
      this.lr = new LinkResolver(isDebug, buildnumber, wsRoot, appRoot, resourceRoot);
   }

   getInfo(name: string, theme: string): IThemeInfo {
      const themeType = this.getThemeType(name, theme);
      if (name.indexOf('.css') !== -1) {
         return { themeType, href: name };
      }
      const href: string = (theme === EMPTY_THEME) ?
         this.lr.resolveLink(name, { ext: 'css' }) :
         this.lr.resolveCssWithTheme(name, theme);
      return { themeType, href };
   }

   load(url: string): Promise<void> {
      return fetch.fetch({ url, credentials: 'same-origin' }).then(() => void 0);
   }

   private getThemeType(name: string, theme: string): THEME_TYPE {
      const themeType = this.lr.isNewTheme(name) ? THEME_TYPE.MULTI : THEME_TYPE.SINGLE;
      if (theme === EMPTY_THEME || themeType === THEME_TYPE.SINGLE) {
         return themeType;
      }
      return this.lr.isThemeExists(name, theme) ? themeType : THEME_TYPE.UNDEFINED;
   }
}
export interface ICssLoader {
   getInfo(name: string, theme?: string): IThemeInfo;
   load(href: string): Promise<void>;
}

interface IThemeInfo {
   themeType: THEME_TYPE;
   href: string;
}
