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

   load(loader: ILoader): Promise<void> {
      /**
       * На клиенте делаем fetch для новых стилей и игнориуем результат т.к монтируем в head стили как link элемент.
       * Браузер кэширует запрошенные через fetch стили, повторной загрузки не будет, а ошибки загрузки перехватываются.
       */
      return loader.load(this.href)
         .then(() => { mountElement(this.element); })
         .then(() => { this.isMounted = true; });
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

/**
 * Монтирование link-элемента со стилями в head,
 * сохрание css/Style в Store
 */
function mountElement(el: IHTMLElement): void {
   document.head.appendChild(el as HTMLLinkElement);
}
