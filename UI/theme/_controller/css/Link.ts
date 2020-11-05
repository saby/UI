/// <amd-module name='UI/theme/_controller/css/Link' />
import { ModulesLoader } from 'UI/Utils';
import { Base } from './Base';
import { ELEMENT_ATTR, THEME_TYPE, CSS_MODULE_PREFIX } from './const';
import { ICssEntity, IHTMLElement } from './interface';

/**
 * Мультитемная ссылка на клиенте
 */
export default class Link extends Base implements ICssEntity {
   element: IHTMLElement;

   constructor(
      href: string,
      cssName: string,
      themeName: string,
      element?: IHTMLElement,
      public themeType: THEME_TYPE = THEME_TYPE.MULTI
   ) {
      super(href, cssName, themeName, themeType);
      this.element = element || createElement(href, cssName, themeName, themeType);
   }

   load(): Promise<void> {
      /**
       * CSS файл, который не привязан к теме, может прилететь внутри какого-то бандла
       * https://online.sbis.ru/opendoc.html?guid=e5ea8fc8-f6de-4684-af44-5461ceef8990
       * Проблема в том, что мы не знаем: прилетел этот бандл уже или не прилетел.
       * TODO: Удалить в процессе внедрения HEAD API (он решит проблему дублей)
       */
      if (ModulesLoader.isLoaded(CSS_MODULE_PREFIX + this.cssName)) {
         return new Promise<void>((resolve) => {
            this.isMounted = true;
            resolve();
         });
      }
      /**
       * На клиенте делаем fetch для новых стилей и игнориуем результат т.к монтируем в head стили как link элемент.
       * Браузер кэширует запрошенные через fetch стили, повторной загрузки не будет, а ошибки загрузки перехватываются.
       */
      this.loading = mountElement(this.element)
         .then(() => { this.isMounted = true; })
         .catch((e) => { this.element.remove(); throw e; });
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
      const timestamp = Date.now();
      const onerror = () => {
         reject(new Error(
            'Couldn\'t load ' + el.getAttribute(ELEMENT_ATTR.HREF) + ' in ' + (Date.now() - timestamp) + ' ms.\n\t' +
            el.getAttribute(ELEMENT_ATTR.THEME_TYPE) + ' css ' +
            el.getAttribute(ELEMENT_ATTR.NAME) + ' for ' +
            el.getAttribute(ELEMENT_ATTR.THEME) + ' theme.')
         );
      };
      try {
         document.head.appendChild(el as HTMLLinkElement);
         (el as HTMLLinkElement).addEventListener('load', resolve.bind(null));
         (el as HTMLLinkElement).addEventListener('error', onerror);
         setTimeout(onerror, TIMEOUT);
      } catch (_) {
         onerror();
      }
   });
}
