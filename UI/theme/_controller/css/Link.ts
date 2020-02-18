/// <amd-module name='UI/theme/_controller/CssLinkSP' />
import { Base, THEME_TYPE, ELEMENT_ATTR } from 'UI/theme/_controller/css/Base';
/**
 * Сущность, представляющая StyleLink
 * Используется для подключения тем в head на СП
 */
export default class Link extends Base {

   constructor(
      href: string,
      name: string,
      theme: string,
      themeType: THEME_TYPE
   ) {
      super(name, theme, themeType);
      this.html = getLinkHtml(href, name, theme, themeType);
   };

   static from(element: HTMLLinkElement): Link {
      const href = element.getAttribute(ELEMENT_ATTR.HREF);
      const name = element.getAttribute(ELEMENT_ATTR.NAME);
      const theme = element.getAttribute(ELEMENT_ATTR.THEME);
      const themeType = <THEME_TYPE> element.getAttribute(ELEMENT_ATTR.THEME_TYPE);
      return new Link(href, name, theme, themeType);
   };
}

function getLinkHtml(href: string, name: string, theme: string, themeType: THEME_TYPE) {
   return `<link rel="stylesheet" type="text/css" data-vdomignore="true"
            ${ELEMENT_ATTR.THEME_TYPE}="${themeType}"
            ${ELEMENT_ATTR.THEME}="${theme}"
            ${ELEMENT_ATTR.NAME}="${name}"
            ${ELEMENT_ATTR.HREF}="${href}" 
            />`;
}