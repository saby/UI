/// <amd-module name='UI/theme/_controller/css/LinkPS' />
import { Base } from 'UI/theme/_controller/css/Base';
import { ICssEntity, ILoader } from 'UI/theme/_controller/css/interface';
import { THEME_TYPE, ELEMENT_ATTR } from 'UI/theme/_controller/css/const';

/**
 * Мультитемная ссылка на СП
 */
export default class LinkPS extends Base implements ICssEntity {
   protected readonly themeType: THEME_TYPE = THEME_TYPE.MULTI;

   constructor(
      href: string,
      cssName: string,
      themeName: string,
   ) {
      super(href, cssName, themeName);
      this.outerHtml = getLinkHtml(href, cssName, themeName, this.themeType);
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
