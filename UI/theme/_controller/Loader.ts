/// <amd-module name='UI/theme/_controller/Loader' />
// @ts-ignore
import * as LinkResolver from 'Core/LinkResolver/LinkResolver';
import { constants } from 'Env/Env';
import { EMPTY_THEME, THEME_TYPE } from 'UI/theme/_controller/css/Base';
import { fetch } from 'Browser/Transport';
export default class Loader implements ICssLoader {
   lr: LinkResolver;

   constructor(isDebug: boolean = false) {
      const { buildnumber, wsRoot, appRoot, resourceRoot } = constants;
      this.lr = new LinkResolver(isDebug, buildnumber, wsRoot, appRoot, resourceRoot);
   }

   getInfo(name: string, theme: string): IThemeInfo {
      const themeType = this.lr.isNewTheme(name, theme) ? THEME_TYPE.MULTI : THEME_TYPE.SINGLE;
      const href: string = (theme === EMPTY_THEME) ?
         this.lr.resolveLink(name, { ext: 'css' }) :
         this.lr.resolveCssWithTheme(name, theme);
      return { href, themeType };
   }

   load(url: string): Promise<void> {
      return fetch.fetch({ url }).then(() => void 0);
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
