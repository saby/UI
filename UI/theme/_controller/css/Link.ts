/// <amd-module name='UI/theme/_controller/css/Link' />
import { Base, THEME_TYPE, ELEMENT_ATTR, IHTMLElement, ICssEntity, ILoader } from 'UI/theme/_controller/css/Base';
/**
 * Сущность, представляющая css/Link
 * Используется для подключения внешних тем в head на СП
 */
export default class Link extends Base implements ICssEntity {

   constructor(
      href: string,
      cssName: string,
      themeName: string,
      themeType: THEME_TYPE,
      public element: IHTMLElement = createElement(href, cssName, themeName, themeType)
   ) {
      super(href, cssName, themeName, themeType);
      this.outerHtml = element.outerHTML;
   }

   load(loader: ILoader): Promise<void> {
      /**
       * На клиенте делаем fetch для новых стилей и игнориуем результат т.к монтируем в head стили как link элемент.
       * Браузер кэширует запрошенные через fetch стили, повторной загрузки не будет, а ошибки загрузки перехватываются.
       */
      return loader.load(this.href).then(() => { mountElement(this.element); });
   }

   /**
    * Удаление зависимости контрола от css
    * @param force принудительное удаление
    * @return {boolean} true, если css никому не нужна контролам, удалена из DOM
    * @example
    *    const base = new Base(name, theme, themeType);
    *    base.require();
    *    await base.remove(); // Promise<false>
    *    await base.remove(); // Promise<true>
    */
   remove(force: boolean = false): Promise<boolean> {
      return super.remove(force).then((isRemoved) => {
         if (isRemoved) {
            this.element.remove();
         }
         return isRemoved;
      });
   }

   /**
    * Создание экземпляра Link из HTMLLinkElement
    * @example
    * // получить массив Link
    *    Array
    *         .from(document.getElementsByTagName('link'))
    *         .map(Link.from)
    */
   static from(element: IHTMLElement): Link | null {
      const href = element.getAttribute(ELEMENT_ATTR.HREF);
      const name = element.getAttribute(ELEMENT_ATTR.NAME);
      const theme = element.getAttribute(ELEMENT_ATTR.THEME);
      const themeType = element.getAttribute(ELEMENT_ATTR.THEME_TYPE) as THEME_TYPE;
      const isNull = (prop) => Object.is(prop, null);
      if ([name, href, theme, themeType].some(isNull)) {
         return null;
      }
      return new Link(href, name, theme, themeType, element);
   }
}

function createElement(href: string, cssName: string, themeName: string, themeType: THEME_TYPE): HTMLLinkElement {
   const element = document.createElement('link');
   element.setAttribute('data-vdomignore', 'true');
   element.setAttribute('rel', 'stylesheet');
   element.setAttribute('type', 'text/css');
   element.setAttribute(ELEMENT_ATTR.HREF, href);
   element.setAttribute(ELEMENT_ATTR.NAME, cssName);
   element.setAttribute(ELEMENT_ATTR.THEME, themeName);
   element.setAttribute(ELEMENT_ATTR.THEME_TYPE, `${themeType}`);
   return element;
}

/**
 * Монтирование link-элемента со стилями в head,
 * сохрание css/Style в Store
 */
function mountElement(el: IHTMLElement): void {
   document.head.appendChild(el as HTMLLinkElement);
}
