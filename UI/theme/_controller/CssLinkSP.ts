/// <amd-module name='UI/theme/_controller/CssLinkSP' />

/**
 * Сущность, представляющая стили на СП
 */
export default class CssLinkSP implements ICssLink {

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

export interface ICssLink {
   name: string;
   theme: string;
   themeType: THEME_TYPE;
   require(): this;
   remove(): Promise<boolean>;
}