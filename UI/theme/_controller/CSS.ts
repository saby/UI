/// <amd-module name='UI/theme/_controller/CSS' />
import { THEME_TYPE, ELEMENT_ATTR } from 'UI/theme/_controller/css/const';
import { ICssEntity, IHTMLElement } from 'UI/theme/_controller/css/interface';
import SingleLinkPS from 'UI/theme/_controller/css/SingleLinkPS';
import SingleLink from 'UI/theme/_controller/css/SingleLink';
import LinkPS from 'UI/theme/_controller/css/LinkPS';
import Link from 'UI/theme/_controller/css/Link';
// @ts-ignore
import { constants } from 'Env/Env';


export function createEntity(href: string, cssName: string, themeName: string, themeType: THEME_TYPE): ICssEntity {
   if (themeType === THEME_TYPE.MULTI) {
      const LinkClass = constants.isServerSide ? LinkPS : Link;
      return new LinkClass(href, cssName, themeName);
   }
   const SingleLinkClass = constants.isServerSide ? SingleLinkPS : SingleLink;
   return new SingleLinkClass(href, cssName, themeName);
}
/**
 * Создание экземпляра Link из HTMLLinkElement
 * @example
 * import { restoreEntity } from 'UI/theme/_controller/CSS';
 * // получить массив Link
 *    Array
 *         .from(document.getElementsByTagName('link'))
 *         .map(restoreEntity)
 */
export function restoreEntity(element: IHTMLElement): IRestoredEntity {
   const href = element.getAttribute(ELEMENT_ATTR.HREF);
   const name = element.getAttribute(ELEMENT_ATTR.NAME);
   const theme = element.getAttribute(ELEMENT_ATTR.THEME);
   const themeType = element.getAttribute(ELEMENT_ATTR.THEME_TYPE) as THEME_TYPE;
   const isNull = (prop) => Object.is(prop, null);
   if ([name, href, theme, themeType].some(isNull)) {
      return null;
   }
   const LinkClass = (themeType === THEME_TYPE.SINGLE) ? SingleLink : Link;
   return new LinkClass(href, name, theme, element);
}
export const isLinkEntity = (entity: IRestoredEntity) => entity instanceof Link;
/**
 * Предикат фильтрации немультитемных css
 * @param link 
 */
export const isSingleEntity = (link: ICssEntity): link is SingleLink | SingleLinkPS => link instanceof SingleLink || link instanceof SingleLinkPS;

type IRestoredEntity = Link | SingleLink | null;