/// <amd-module name='UI/theme/_controller/css/LinkPS' />
import { Base, THEME_TYPE, ELEMENT_ATTR, ICssEntity, ILoader } from 'UI/theme/_controller/css/Base';
/**
 * Сущность, представляющая css/LinkPS
 * Используется для подключения внешних тем в head на СП
 */
export default class LinkPS extends Base implements ICssEntity {

   constructor(
      href: string,
      cssName: string,
      themeName: string,
      themeType: THEME_TYPE
   ) {
      super(href, cssName, themeName, themeType);
      this.outerHtml = getLinkHtml(href, cssName, themeName, themeType);
   }

   load(_: ILoader): Promise<void> {
      return Promise.resolve();
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
