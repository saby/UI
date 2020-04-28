/// <amd-module name='UI/theme/_controller/css/interface' />
/**
 * Сущность, представляющая собой ссылку на таблицу _мультитемных_ стилей
 * Используется для подключения внешних тем в head
 */
export interface ICssEntity {
   /** Вмонтирована ли CssEntity в разметку */
   isMounted: boolean;
   /** Процесс загрузки css */
   loading: Promise<void>;
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
   outerHtml: string;
   /**
    * Ссылка на css
    */
   href: string;
   /** Название css */
   cssName: string;
   /** Название темы */
   themeName: string;
   /**
    * Восстребование стилей контроллом
    * @example
    *    const base = new Base(name, theme, themeType);
    *    base.require();
    *    await base.remove(); // Promise<false>
    *    await base.remove(); // Promise<true>
    */
   require(): void;
   /**
    * Удаление зависимости контрола от css
    * @return {boolean} true, если css никому не нужна контролам, удалена из DOM
    * @example
    *    const base = new Base(name, theme, themeType);
    *    base.require();
    *    await base.remove(); // Promise<false>
    *    await base.remove(); // Promise<true>
    */
   remove(): Promise<boolean>;
   /**
    * Скачивание стилей
    * @param loader
    */
   load(): Promise<void>;
}
/**
 * Сущность, представляющая собой ссылку на таблицу _немультитемных_ стилей
 */
export interface ISingleCssEntity extends ICssEntity {
   /** Принудительное удаление */
   removeForce(): Promise<void>;
}
export interface IHTMLElement {
   outerHTML: string;
   remove(): void;
   getAttribute(a: string): string;
}
