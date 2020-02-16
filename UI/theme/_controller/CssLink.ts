/// <amd-module name='UI/theme/_controller/CssLink' />

import CssLinkSP, { ICssLink, THEME_TYPE, DEFAULT_THEME } from 'UI/theme/_controller/CssLinkSP';

/**
 * Сущность, представляющая стили в DOM
 */
export default class CssLink extends CssLinkSP implements ICssLink {
   name: string;
   theme: string;
   css: string;

   constructor(
      readonly element: ICssLinkElement,
      readonly themeType: THEME_TYPE = THEME_TYPE.MULTI
   ) {
      super(element.getAttribute('css-name'), element.getAttribute('theme-name'));
      this.css = element.innerHTML || '';
   }

   static create(
      style: string,
      name: string,
      theme: string = DEFAULT_THEME,
      themeType: THEME_TYPE = THEME_TYPE.MULTI
   ): CssLink {
      const element = document.createElement('style');
      element.setAttribute('data-vdomignore', 'true');
      element.setAttribute('css-name', name);
      element.setAttribute('theme-type', `${themeType}`);
      element.setAttribute('theme-name', theme);
      element.innerHTML = style;
      return new CssLink(element, themeType);
   }

   /**
    * Удаление зависимости контрола от css
    * @return {boolean} true, если css никому не нужна контролам, удалена из DOM
    */
   remove(): Promise<boolean> {
      this.requirement--;
      if (this.requirement !== 0) {
         return Promise.resolve(false);
      }
      return new Promise((res, rej) => {
         setTimeout(() => {
            try {
               this.element.remove();
               res(true);
            } catch (e) { rej(e); }
         }, 0);
      });
   }
}

/**
 * Если css вставляется в страницу в <style>, относительные пути перестанут работать
 * replaceURL меняет эти url, чтобы они работали от корня.
 * @param cssStyle
 * @param path относительный путь до css
 */
export function replaceCssURL(cssStyle: string, path: string = "/"): string {
   const forbiddenUrlSym: string[] = ['url(/', "url('/", 'url("/', "url(#", 'data:'];
   const expectedUrlSym: string[] = ['url(', '?#iefix'];

   return cssStyle.replace(/url\(.+?\)/g, (url: string) => {
      const isIncluded = (sym: string) => url.indexOf(sym) !== -1;
      if (!expectedUrlSym.some(isIncluded) || forbiddenUrlSym.some(isIncluded)) {
         return url;
      }
      return `url("${path.split('/').slice(0, -1).join('/')}/${url.replace(/url\(|\)|'|"/g, '')}")`;
   });
}


interface ICssLinkElement {
   getAttribute(a: string): string;
   remove(): void;
   innerHTML: string;
}