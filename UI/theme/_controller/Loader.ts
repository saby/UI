/// <amd-module name='UI/theme/_controller/Loader' />
// @ts-ignore
import * as LinkResolver from 'Core/LinkResolver/LinkResolver';
// @ts-ignore
import { constants, cookie } from 'Env/Env';
import { EMPTY_THEME, THEME_TYPE } from 'UI/theme/_controller/css/Base';

export default class Loader implements ICssLoader {
   lr: LinkResolver;
   constructor() {
      const contents = (1, eval)('this').contents;
      const isDebug = cookie.get('s3debug') === 'true' || contents?.buildMode === 'debug';
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

   load(href: string): Promise<string> {
      return fetchCss(href)
         .then(parseResponse)
         .then((css) => replaceCssURL(css, href));
   }
}

function fetchCss(url: string): Promise<XMLHttpRequest> {
   return new Promise((resolve, reject) => {
      const req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.onload = () => {
         resolve(req);
      };
      req.onerror = () => {
         reject(new Error(`Couldn\'t load css: ${req.responseURL}\nResponse status ${req.status}`));
      };
      req.withCredentials = true;
      req.send();
   });
}
const SUCCESS_RESPONCSE_CODE = 200;

function parseResponse(req: XMLHttpRequest): string {
   if (req.status !== SUCCESS_RESPONCSE_CODE) {
      throw new Error(`Couldn\'t load css: ${req.responseURL}\nResponse status ${req.status}`);
   }
   return req.response;
}

/**
 * Если css вставляется в страницу в <style>, относительные пути перестанут работать
 * replaceURL меняет эти url, чтобы они работали от корня.
 * @param cssStyle
 * @param path относительный путь до css
 */
export function replaceCssURL(cssStyle: string, path: string = '/'): string {
   const forbiddenUrlSym: string[] = ['url(/', "url('/", 'url("/', 'url(#', 'data:'];
   const expectedUrlSym: string[] = ['url(', '?#iefix'];

   return cssStyle.replace(/url\(.+?\)/g, (url: string) => {
      const isIncluded = (sym: string) => url.indexOf(sym) !== -1;
      if (!expectedUrlSym.some(isIncluded) || forbiddenUrlSym.some(isIncluded)) {
         return url;
      }
      return `url("${path.split('/').slice(0, -1).join('/')}/${url.replace(/url\(|\)|'|"/g, '')}")`;
   });
}
export interface ICssLoader {
   getInfo(name: string, theme?: string): IThemeInfo;
   load(href: string): Promise<string>;
}

interface IThemeInfo {
   themeType: THEME_TYPE;
   href: string;
}
