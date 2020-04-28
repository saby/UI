/// <amd-module name='UI/theme/_controller/css/Link' />
import { Base } from 'UI/theme/_controller/css/Base';
import { IHTMLElement, ICssEntity, ILoader } from 'UI/theme/_controller/css/interface';
import { THEME_TYPE, ELEMENT_ATTR } from 'UI/theme/_controller/css/const';
/**
 * Мультитемная ссылка на клиенте
 */
export default class Link extends Base implements ICssEntity {
   protected readonly themeType: THEME_TYPE = THEME_TYPE.MULTI;
   element: IHTMLElement;

   constructor(
      href: string,
      cssName: string,
      themeName: string,
      element?: IHTMLElement
   ) {
      super(href, cssName, themeName);
      this.element = element || createElement(href, cssName, themeName, this.themeType);
      this.outerHtml = this.element.outerHTML;
   }

   load(_loader: ILoader): Promise<void> {
      /**
       * На клиенте делаем fetch для новых стилей и игнориуем результат т.к монтируем в head стили как link элемент.
       * Браузер кэширует запрошенные через fetch стили, повторной загрузки не будет, а ошибки загрузки перехватываются.
       */
      this.loading = mountElement(this.element)
         .then(() => { this.isMounted = true; });
      return this.loading;
   }

   /**
    * Удаление зависимости контрола от css
    * @return {boolean} true, если css никому не нужна контролам, удалена из DOM
    * @example
    *    const base = new Base(name, theme, themeType);
    *    base.require();
    *    await base.remove(); // Promise<false>
    *    await base.remove(); // Promise<true>
    */
   remove(): Promise<boolean> {
      return super.remove().then((isRemoved) => {
         if (isRemoved) {
            this.element.remove();
         }
         return isRemoved;
      });
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

const TIMEOUT = 30000;
/**
 * Монтирование link-элемента со стилями в head,
 */
function mountElement(el: IHTMLElement): Promise<void> {
   return new Promise((resolve, reject) => {
      try {
         document.head.appendChild(el as HTMLLinkElement);
         (el as HTMLLinkElement).addEventListener('load', resolve.bind(null));
         (el as HTMLLinkElement).addEventListener('error', reject.bind(null));
         setTimeout(() => { reject(new Error(`CSS не загрузилась за ${TIMEOUT}ms`)); }, TIMEOUT);
      } catch (e) {
         reject(e);
      }
   });
}
