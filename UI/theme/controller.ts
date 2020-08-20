/// <amd-module name='UI/theme/controller' />
/**
 * Библиотека контроллера тем
 * @remark
 * Контроллер управляет загрузкой/удалением стилей всех контроллов на wasaby-странице на клиенте и СП
 * Подробнее о работе с темами оформления читайте {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/themes/ здесь}.
 * @library UI/theme/controller
 * @includes getThemeController UI/theme/_controller/Controller#getInstance
 * @includes THEME_TYPE UI/theme/_controller/css/Base#THEME_TYPE
 * @includes EMPTY_THEME UI/theme/_controller/css/Base#EMPTY_THEME
 * @public
 * @author Ибрагимов А.А.
 */
import { Controller } from 'UI/theme/_controller/Controller';
import LinkResolver from "./_controller/LinkResolver";
export const getThemeController = Controller.getInstance;
export { THEME_TYPE, EMPTY_THEME, DEFAULT_THEME } from 'UI/theme/_controller/css/const';
export { LinkResolver }
