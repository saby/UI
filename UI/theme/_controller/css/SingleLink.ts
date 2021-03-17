/// <amd-module name='UI/theme/_controller/css/SingleLink' />
import { Head as HeadAPI } from "Application/Page";
import Link from './Link';
import { THEME_TYPE, DEPRECATED_ELEMENT_ATTR } from './const';
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
      if (element) {
         this.href = this.href || element.getAttribute(DEPRECATED_ELEMENT_ATTR.HREF);
         this.cssName = this.cssName || element.getAttribute(DEPRECATED_ELEMENT_ATTR.NAME);
         this.themeName = this.themeName || element.getAttribute(DEPRECATED_ELEMENT_ATTR.THEME);
         this.themeType = this.themeType || THEME_TYPE[element.getAttribute(DEPRECATED_ELEMENT_ATTR.THEME_TYPE)];
      }
   }

   removeForce(): Promise<void> {
      this.isMounted = false;
      this.requirement = 0;
      if (this.headTagId) {
         HeadAPI.getInstance().deleteTag(this.headTagId);
      }
      return Promise.resolve();
   }
}
