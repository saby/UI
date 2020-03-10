/// <amd-module name='UI/theme/_controller/css/const' />

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
export const EMPTY_THEME: string = 'no_theme';
/**
 * Тип темы по-умолчанию
 */
export const DEFAULT_THEME_TYPE: THEME_TYPE = THEME_TYPE.MULTI;