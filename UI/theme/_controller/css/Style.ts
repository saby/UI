/// <amd-module name='UI/theme/_controller/css/Style' />

import { Base, THEME_TYPE, EMPTY_THEME, ELEMENT_ATTR, IHTMLElement } from 'UI/theme/_controller/css/Base';

/**
 * Сущность, представляющая StyleElement,
 * Используется для подкючения в head на клиенте
 */
export default class Style extends Base {

   constructor(
      cssName: string,
      themeName: string,
      themeType: THEME_TYPE,
      element: IHTMLElement,
   ) {
      super(cssName, themeName, themeType, element);
      this.outerHtml = element.innerHTML;
   }

   static from(
      css: string,
      name: string,
      theme: string = EMPTY_THEME,
      themeType: THEME_TYPE = THEME_TYPE.MULTI
   ): Style {
      const element = document.createElement('style');
      element.setAttribute('data-vdomignore', 'true');
      element.setAttribute(ELEMENT_ATTR.NAME, name);
      element.setAttribute(ELEMENT_ATTR.THEME, theme);
      element.setAttribute(ELEMENT_ATTR.THEME_TYPE, `${themeType}`);
      element.innerHTML = css;
      return new Style(name, theme, themeType, element);
   }
}
