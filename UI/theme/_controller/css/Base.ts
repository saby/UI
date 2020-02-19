/// <amd-module name='UI/theme/_controller/css/Base' />

export class Base implements ICssEntity {
   public html: string = '';

   constructor(
      public name: string,
      public theme: string = DEFAULT_THEME,
      public themeType: THEME_TYPE = DEFAULT_THEME_TYPE
   ) { };

   /**
    * Скольким контролам требуется данная css
    * Если 0 - удаляем 
    */
   protected requirement: number = 1;

   require() {
      this.requirement++;
      return this;
   }

   /**
    * Удаление зависимости контрола от css
    * @return {boolean} true, если css никому не нужна контролам, удалена из DOM
    */
   remove(): Promise<boolean> {
      this.requirement--;
      return Promise.resolve(this.requirement === 0);
   }
}
/**
 * перечисление аттрибутов css сущностей в DOM
 */
export enum ELEMENT_ATTR {
   HREF = 'href',
   NAME = 'css-entity-name',
   THEME = 'css-entity-theme',
   THEME_TYPE = 'theme-type',
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
 * Тип темы по-умолчанию
 */
export const DEFAULT_THEME_TYPE: THEME_TYPE = THEME_TYPE.MULTI;

export interface ICssEntity {
   /** html разметка css сущности */
   html: string;
   /** Название контрола */
   name: string;
   /** Название темы */
   theme: string;
   /** Тип темы */
   themeType: THEME_TYPE;
   require(): this;
   remove(): Promise<boolean>;
}