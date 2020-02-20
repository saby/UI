/// <amd-module name='UI/theme/_controller/Loader' />
// @ts-ignore
import * as LinkResolver from 'Core/LinkResolver/LinkResolver';
// @ts-ignore
import { constants, cookie } from 'Env/Env';
import { EMPTY_THEME } from 'UI/theme/_controller/css/Base';

export default class Loader {
   lr: LinkResolver;
   constructor() {
      const contents = (1, eval)('this').contents;
      const isDebug = cookie.get('s3debug') === 'true' || contents?.buildMode === 'debug';
      const { buildnumber, wsRoot, appRoot, resourceRoot } = constants;
      this.lr = new LinkResolver(isDebug, buildnumber, wsRoot, appRoot, resourceRoot);
   }

   getInfo(name: string, theme: string) {
      const isNewTheme: boolean = this.lr.isNewTheme(name, theme);
      const href: string = (theme === EMPTY_THEME) ? this.lr.resolveLink(name, { ext: 'css' }) : this.lr.resolveCssWithTheme(name, theme);
      return { href, isNewTheme };
   }

   load(name: string, theme: string) {
      const { href } = this.getInfo(name, theme);
      return fetchCss(href)
         .then(parseResponse)
         .then((css: string) => ({ css, href }));
   }
}

function fetchCss(url) {
   return new Promise(function (resolve, reject) {
      const req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.onload = () => {
         resolve(req);
      };
      req.onerror = () => {
         reject(new Error('Couldn\'t load css: ' + req.responseURL + "\nResponse status " + req.status));
      };
      req.withCredentials = true;
      req.send();
   });
}

function parseResponse(response) {
   if (response.status !== 200) {
      throw new Error('Couldn\'t load css: ' + response.responseURL + ' ' + "Response status " + response.status);
   }
   return response.response;
}
