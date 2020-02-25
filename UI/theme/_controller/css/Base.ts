/// <amd-module name='UI/theme/_controller/css/Base' />

export class Base implements ICssEntity {
   /**
    * HTML- разметка сущности
    * @example
    * // ts
    * this.styles = cssNames.map((name) => new Link(name).outerHtml)
    *                       .join('\n');
    * // wml
    * <head>
    *    {{ styles }}
    * </head>
    */
   outerHtml: string = '';

   /**
    * Скольким контролам требуется данная css
    * Если 0 - удаляем
    */
   protected requirement: number = 1;

   constructor(
      public cssName: string,
      public themeName: string = DEFAULT_THEME,
      public themeType: THEME_TYPE = DEFAULT_THEME_TYPE,
      public element: IHTMLElement = null
   ) { }

   /**
    * Восстребование стилей контроллом
    * @example
    *    const base = new Base(name, theme, themeType);
    *    base.require();
    *    await base.remove(); // Promise<false>
    *    await base.remove(); // Promise<true>
    */
   require(): void {
      this.requirement++;
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
      this.requirement--;
      if (!force && this.requirement !== 0) {
         return Promise.resolve(false);
      }
      return new Promise((res, rej) => {
         setTimeout(() => {
            try {
               this.element?.remove();
               res(true);
            } catch (e) { rej(e); }
         }, 0);
      });
   }
}
/**
 * перечисление аттрибутов css сущностей в DOM
 */
export enum ELEMENT_ATTR {
   HREF = 'href',
   NAME = 'css-entity-name',
   THEME = 'css-entity-theme',
   THEME_TYPE = 'theme-type'
}
/**
 * Тип темы
 */
export enum THEME_TYPE {
   /**
    * мультитемные css
    * нет необходимости удалять другие темы
    * селекторы включают в себя имя темы, т.е уникальны
    */
   MULTI = 'multitheme',
   /**
    * немультитемные css, при переключении темы остальные темы должны удаляться,
    * т.к возникают конфликты селекторов (они одинаковые)
    */
   SINGLE = 'signletheme'
}
/**
 * Тема по-умолчанию
 */
export const DEFAULT_THEME: string = 'default';
/**
 * Стили без темы
 */
export const EMPTY_THEME: string = '';
/**
 * Тип темы по-умолчанию
 */
export const DEFAULT_THEME_TYPE: THEME_TYPE = THEME_TYPE.MULTI;

export interface ICssEntity {
   /** html разметка css сущности */
   outerHtml: string;
   /** Название css */
   cssName: string;
   /** Название темы */
   themeName: string;
   /** Тип темы */
   themeType: THEME_TYPE;
   require(): void;
   remove(force?: boolean): Promise<boolean>;
}

export interface IHTMLElement {
   outerHTML: string;
   remove(): void;
   getAttribute(a: string): string;
}
