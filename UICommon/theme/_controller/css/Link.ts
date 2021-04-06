/// <amd-module name='UICommon/theme/_controller/css/Link' />
import * as ModulesLoader from 'WasabyLoader/ModulesLoader';
import { Base } from './Base';
import { ELEMENT_ATTR, THEME_TYPE, CSS_MODULE_PREFIX, EMPTY_THEME } from './const';
import { ICssEntity, IHTMLElement } from './interface';
import { Head as HeadAPI } from 'Application/Page';
import { IHeadTagId, IHeadTagAttrs } from 'Application/Interface';

const TIMEOUT = 30000;

/**
 * Мультитемная ссылка на клиенте
 */
export default class Link extends Base implements ICssEntity {
   headTagId: IHeadTagId;

   constructor(
       href: string,
       cssName: string,
       themeName: string,
       element?: IHTMLElement,
       public themeType: THEME_TYPE = THEME_TYPE.MULTI
   ) {
      super(href, cssName, themeName, themeType);
      if (element) {
         this.href = this.href || element.getAttribute(ELEMENT_ATTR.HREF);
         this.cssName = this.cssName || element.getAttribute(ELEMENT_ATTR.NAME);
         this.themeName = this.themeName || element.getAttribute(ELEMENT_ATTR.THEME);
         this.themeType = this.themeType || THEME_TYPE[element.getAttribute(ELEMENT_ATTR.THEME_TYPE)];
      }
   }

   load(): Promise<void> {
      /**
       * CSS файл, который не привязан к теме, может прилететь внутри какого-то бандла
       * https://online.sbis.ru/opendoc.html?guid=e5ea8fc8-f6de-4684-af44-5461ceef8990
       * Проблема в том, что мы не знаем: прилетел этот бандл уже или не прилетел.
       */
      if ((this.themeName === EMPTY_THEME) && ModulesLoader.isLoaded(CSS_MODULE_PREFIX + this.cssName)) {
         return new Promise<void>((resolve) => {
            this.isMounted = true;
            resolve();
         });
      }
      /**
       * На клиенте делаем fetch для новых стилей и игнориуем результат т.к монтируем в head стили как link элемент.
       * Браузер кэширует запрошенные через fetch стили, повторной загрузки не будет, а ошибки загрузки перехватываются.
       */
      this.loading = this.mountElement()
          .then(() => { this.isMounted = true; })
          .catch((e) => {
             if (this.headTagId) {
                HeadAPI.getInstance().deleteTag(this.headTagId);
             }
             throw e;
          });
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
            HeadAPI.getInstance().deleteTag(this.headTagId);
         }
         return isRemoved;
      });
   }
   /**
    * Монтирование link-элемента со стилями в head
    */
   mountElement(): Promise<void> {
      return new Promise((resolve, reject) => {
         const timestamp = Date.now();
         const onerror = () => {
            reject(new Error(
                'Couldn\'t load ' + this.href + ' in ' + (Date.now() - timestamp) + ' ms.\n\t' +
                this.themeType + ' css ' +
                this.cssName + ' for ' +
                this.themeName + ' theme.')
            );
         };
         const attrs = generateAttrs(this);
         this.headTagId = HeadAPI.getInstance().createTag('link', attrs, null, {
            load: resolve.bind(null),
            error: onerror
         });
         setTimeout(onerror, TIMEOUT);
      });
   }
}

function generateAttrs(item: ICssEntity): IHeadTagAttrs {
   return {
      rel: 'stylesheet',
      type: 'text/css',
      [ELEMENT_ATTR.HREF]: item.href,
      [ELEMENT_ATTR.NAME]: item.cssName,
      [ELEMENT_ATTR.THEME]: item.themeName,
      [ELEMENT_ATTR.THEME_TYPE]: item.themeType
   };
}
