/// <amd-module name='UI/theme/_controller/css/SingleLink' />
import Link from 'UI/theme/_controller/css/Link';
import { THEME_TYPE } from 'UI/theme/_controller/css/const';
import { ISingleCssEntity } from 'UI/theme/_controller/css/interface';
/**
 * Немультитемная ссылка на клиенте
 */
export default class SingleLink extends Link implements ISingleCssEntity {
   protected readonly themeType: THEME_TYPE = THEME_TYPE.SINGLE;

   removeForce() {
      this.requirement = 0;
      this.element.remove();
      return Promise.resolve();
   }
}
