/// <amd-module name='UICommon/theme/_controller/CSS' />
import { THEME_TYPE, ELEMENT_ATTR, DEPRECATED_ELEMENT_ATTR, EMPTY_THEME, DEPRECATED_THEME_TYPE } from './css/const';
import { ICssEntity, IHTMLElement } from './css/interface';
import SingleLinkPS from './css/SingleLinkPS';
import SingleLink from './css/SingleLink';
import LinkPS from './css/LinkPS';
import Link from './css/Link';
// @ts-ignore
import { constants } from 'Env/Env';

const isNull = (prop: string) => prop === null || typeof prop === 'undefined';

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
 * import { restoreEntity } from 'UICommon/theme/_controller/CSS';
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
   if ([name, href, theme, themeType].some(isNull)) {
      return restoreDeprecatedEntity(element);
   }
   const LinkClass = (themeType === THEME_TYPE.SINGLE) ? SingleLink : Link;
   const link = new LinkClass(href, name, theme, element);
   link.isMounted = true;
   return link;
}
/*
 * Устаревшие ссылки вставляются через Controls.decorator:Markup
 */
// TODO https://online.sbis.ru/opendoc.html?guid=af492da0-f245-4a20-b567-8a789038fc39
export function restoreDeprecatedEntity(element: IHTMLElement): IRestoredEntity {
   const href = element.getAttribute(DEPRECATED_ELEMENT_ATTR.HREF);
   // в случаях дополнительных безымянных css, cssName равно href,
   // у href вырезаем cdn приставку, чтобы href полученный LinkResolver совпадал
   const name = element.getAttribute(DEPRECATED_ELEMENT_ATTR.NAME) || cutFromResourсePrefix(href);
   const theme = element.getAttribute(DEPRECATED_ELEMENT_ATTR.THEME) || EMPTY_THEME;
   const themeType =
      element.getAttribute(DEPRECATED_ELEMENT_ATTR.THEME_TYPE) === DEPRECATED_THEME_TYPE.MULTI
         ? THEME_TYPE.MULTI : THEME_TYPE.SINGLE;
   if ([name, href, theme, themeType].some(isNull)) {
      return null;
   }
   const LinkClass = (themeType === THEME_TYPE.SINGLE) ? SingleLink : Link;
   const link = new LinkClass(href, name, theme, element);
   link.isMounted = true;
   return link;
}

export const isLinkEntity = (entity: IRestoredEntity) => entity instanceof Link;
/**
 * Предикат фильтрации немультитемных css
 * @param link
 */
export const isSingleEntity = (link: ICssEntity): link is SingleLink | SingleLinkPS =>
   link instanceof SingleLink || link instanceof SingleLinkPS;

type IRestoredEntity = Link | SingleLink | null;

function cutFromResourсePrefix(href: string): string {
   if (!href) { return null; }
   const index = href.indexOf(constants.resourceRoot);
   if (index === -1) { return href; }
   return href.slice(index);
}
