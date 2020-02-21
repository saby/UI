/// <amd-module name='UI/theme/_controller/css/Link' />
import { Base, THEME_TYPE, ELEMENT_ATTR, IHTMLElement } from 'UI/theme/_controller/css/Base';
/**
 * Сущность, представляющая css/Link
 * Используется для подключения внешних тем в head на СП
 */
export default class Link extends Base {

   constructor(
      href: string,
      cssName: string,
      themeName: string,
      themeType: THEME_TYPE,
      element?: IHTMLElement
   ) {
      super(cssName, themeName, themeType, element);
      this.outerHtml = element?.innerHTML || getLinkHtml(href, cssName, themeName, themeType);
   }

   /**
    * Создание экземпляра Link из HTMLLinkElement
    * @example
    * // получить массив Link
    *    Array
    *         .from(document.getElementsByTagName('link'))
    *         .map(Link.from)
    */
   static from(element: IHTMLElement): Link {
      const href = element.getAttribute(ELEMENT_ATTR.HREF);
      const name = element.getAttribute(ELEMENT_ATTR.NAME);
      const theme = element.getAttribute(ELEMENT_ATTR.THEME);
      const themeType = element.getAttribute(ELEMENT_ATTR.THEME_TYPE) as THEME_TYPE;
      return new Link(href, name, theme, themeType, element);
   }
}

function getLinkHtml(href: string, name: string, theme: string, themeType: THEME_TYPE): string {
   return `<link rel="stylesheet" type="text/css" data-vdomignore="true"
            ${ELEMENT_ATTR.THEME_TYPE}="${themeType}"
            ${ELEMENT_ATTR.THEME}="${theme}"
            ${ELEMENT_ATTR.NAME}="${name}"
            ${ELEMENT_ATTR.HREF}="${href}" 
            />`;
}
