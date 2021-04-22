/// <amd-module name='UICommon/theme/_controller/css/SingleLinkPS' />
import LinkPS from './LinkPS';
import { THEME_TYPE } from './const';
import { ISingleCssEntity } from './interface';
/**
 * Немультитемная ссылка на СП
 */
export default class SingleLinkPS extends LinkPS implements ISingleCssEntity {
   
   constructor(
      href: string,
      cssName: string,
      themeName: string,
   ) {
      super(href, cssName, themeName, THEME_TYPE.SINGLE);
   }

   removeForce(): Promise<void> {
      this.isMounted = false;
      this.requirement = 0;
      return Promise.resolve();
   }
}
