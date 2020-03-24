/// <amd-module name='UI/theme/controller' />
/**
 * Библиотека контроллера тем
 * @remark
 * Контроллер управляет загрузкой/удалением темизированных стилей на wasaby-странице
 * {@link Темы https://wi.sbis.ru/doc/platform/developmentapl/interface-development/themes/}
 * @library UI/theme/controller
 * @includes getThemeController UI/theme/_controller/Controller#getInstance
 * @includes THEME_TYPE UI/theme/_controller/css/Base#THEME_TYPE
 * @includes EMPTY_THEME UI/theme/_controller/css/Base#EMPTY_THEME
 * @public
 * @author Ибрагимов А.А.
 */
import { Controller } from 'UI/theme/_controller/Controller';
export const getThemeController = Controller.getInstance;
export { THEME_TYPE, EMPTY_THEME } from 'UI/theme/_controller/css/const';
