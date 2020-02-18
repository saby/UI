/// <amd-module name='UI/theme/controller' />
/**
 * Библиотека контроллера тем
 * @remark
 * Контроллер управляет загрузкой/удаленим темизированных стилей на wasaby-странице
 * {@link Темы https://wi.sbis.ru/doc/platform/developmentapl/interface-development/themes/}
 * @library UI/theme/controller
 * @includes getThemeController UI/theme/_controller/Controller#getInstance
 * @includes THEME_TYPE UI/theme/_controller/CssLink#THEME_TYPE
 * @public
 * @author Ибрагимов А.А.
 */

export { getInstance as getThemeController } from 'UI/theme/_controller/Controller';
export { THEME_TYPE } from 'UI/theme/_controller/css/Base';
