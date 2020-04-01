/// <amd-module name='UI/theme/_controller/css/SingleLinkPS' />
import LinkPS from 'UI/theme/_controller/css/LinkPS';
import { THEME_TYPE } from 'UI/theme/_controller/css/const';
import { ISingleCssEntity } from 'UI/theme/_controller/css/interface';
/**
 * Немультитемная ссылка на СП
 */
export default class SingleLinkPS extends LinkPS implements ISingleCssEntity {
   protected readonly themeType: THEME_TYPE = THEME_TYPE.SINGLE;

   removeForce(): Promise<void> {
      this.isMounted = false;
      this.requirement = 0;
      return Promise.resolve();
   }
}
