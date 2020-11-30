/// <amd-module name='UI/theme/_controller/css/LinkPS' />
import { default as Link } from './Link';
import { THEME_TYPE } from './const';
import { ICssEntity } from './interface';

/**
 * Мультитемная ссылка на СП
 */
export default class LinkPS extends Link {

   constructor(
      href: string,
      cssName: string,
      themeName: string,
      public themeType: THEME_TYPE = THEME_TYPE.MULTI
   ) {
      super(href, cssName, themeName, null, themeType);
   }
}
