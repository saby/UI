/// <amd-module name='UI/theme/_controller/css/interface' />
import { THEME_TYPE } from './const';
/**
 * Сущность, представляющая собой ссылку на таблицу _мультитемных_ стилей
 * Используется для подключения внешних тем в head
 */
export interface ICssEntity {
   themeType: THEME_TYPE;
   /** Вмонтирована ли CssEntity в разметку */
   isMounted: boolean;
   /** Процесс загрузки css */
   loading: Promise<void>;
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
   remove(): void;
   getAttribute(a: string): string;
}
