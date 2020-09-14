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
 * Устаревшие аттрибуты css сущностей в DOM
 * @deprecated
 * TODO https://online.sbis.ru/opendoc.html?guid=af492da0-f245-4a20-b567-8a789038fc39
 */
export enum DEPRECATED_ELEMENT_ATTR {
   HREF = 'href',
   NAME = 'css-name',
   THEME = 'theme-name',
   THEME_TYPE = 'class'
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
 * Устаревшие наименование типов темы
 * @deprecated
 * TODO https://online.sbis.ru/opendoc.html?guid=af492da0-f245-4a20-b567-8a789038fc39
 */
export enum DEPRECATED_THEME_TYPE {
   /**
    * мультитемные css
    * нет необходимости удалять другие темы
    * селекторы включают в себя имя темы, т.е уникальны
    */
   MULTI = 'new-styles',
   /**
    * немультитемные css, при переключении темы остальные темы должны удаляться,
    * т.к возникают конфликты селекторов (они одинаковые)
    */
   SINGLE = 'css-bundles'
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
