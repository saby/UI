/// <amd-module name='UI/theme/_controller/css/LinkPS' />
import { Base } from 'UI/theme/_controller/css/Base';
import { THEME_TYPE } from 'UI/theme/_controller/css/const';
import { ICssEntity } from 'UI/theme/_controller/css/interface';

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
