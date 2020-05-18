/// <amd-module name='UI/theme/_controller/css/SingleLink' />
import Link from 'UI/theme/_controller/css/Link';
import { THEME_TYPE } from 'UI/theme/_controller/css/const';
import { ISingleCssEntity, IHTMLElement } from 'UI/theme/_controller/css/interface';
/**
 * Немультитемная ссылка на клиенте
 */
export default class SingleLink extends Link implements ISingleCssEntity {
   
   constructor(
      href: string,
      cssName: string,
      themeName: string,
      element?: IHTMLElement,
   ) {
      super(href, cssName, themeName, element, THEME_TYPE.SINGLE);
   }

   removeForce(): Promise<void> {
      this.isMounted = false;
      this.requirement = 0;
      this.element.remove();
      return Promise.resolve();
   }
}
