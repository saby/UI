/// <amd-module name='UI/theme/_controller/css/Style' />

import { Base, THEME_TYPE, DEFAULT_THEME, ELEMENT_ATTR } from 'UI/theme/_controller/css/Base';

/**
 * Сущность, представляющая StyleElement,
 * Используется для подкючения в head на клиенте
 */
export default class Style extends Base {

   constructor(
      public readonly element: HTMLStyleElement,
      name: string,
      theme: string,
      themeType: THEME_TYPE) {
      super(name, theme, themeType);
      this.html = element.innerHTML;
   }

   static from(
      css: string,
      name: string,
      theme: string = DEFAULT_THEME,
      themeType: THEME_TYPE = THEME_TYPE.MULTI
   ): Style {
      const element = document.createElement('style');
      element.setAttribute('data-vdomignore', 'true');
      element.setAttribute(ELEMENT_ATTR.NAME, name);
      element.setAttribute(ELEMENT_ATTR.THEME, theme);
      element.setAttribute(ELEMENT_ATTR.THEME_TYPE, `${themeType}`);
      element.innerHTML = css;
      return new Style(element, name, theme, themeType);
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