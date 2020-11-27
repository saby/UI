/// <amd-module name='UI/theme/_controller/css/SingleLink' />
import Link from './Link';
import { THEME_TYPE } from './const';
import { ISingleCssEntity, IHTMLElement } from './interface';
/**
 * Немультитемная ссылка на клиенте
 */
export default class SingleLink extends Link implements ISingleCssEntity {
   constructor(
      href: string,
      cssName: string,
      themeName: string,
      element?: IHTMLElement
   ) {
      super(href, cssName, themeName, element, THEME_TYPE.SINGLE);
   }

   removeForce(): Promise<void> {
      return this.remove().then(() => {
         this.isMounted = false;
         this.requirement = 0;
      });
   }
}
