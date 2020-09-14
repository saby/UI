/// <amd-module name='UI/theme/_controller/css/LinkPS' />
import { Base } from './Base';
import { THEME_TYPE } from './const';
import { ICssEntity } from './interface';

/**
 * Мультитемная ссылка на СП
 */
export default class LinkPS extends Base implements ICssEntity {

   constructor (
      href: string,
      cssName: string,
      themeName: string,
      public themeType: THEME_TYPE = THEME_TYPE.MULTI
   ) {
      super(href, cssName, themeName, themeType);
   }

   load(): Promise<void> {
      this.isMounted = true;
      return this.loading;
   }
}
