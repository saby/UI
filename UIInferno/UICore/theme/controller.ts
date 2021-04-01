/// <amd-module name='UIUICore/theme/controller' />
/**
 * Библиотека контроллера тем
 * @remark
 * Контроллер управляет загрузкой/удалением стилей всех контроллов на wasaby-странице на клиенте и СП
 * Подробнее о работе с темами оформления читайте {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/themes/ здесь}.
 * @library UICore/theme/controller
 * @includes getThemeController UICore/theme/_controller/Controller#getInstance
 * @includes THEME_TYPE UICore/theme/_controller/css/const#THEME_TYPE
 * @includes EMPTY_THEME UICore/theme/_controller/css/const#EMPTY_THEME
 * @includes DEFAULT_THEME UICore/theme/_controller/css/const#DEFAULT_THEME
 * @public
 * @author Санников К.А.
 */
import { Controller } from './_controller/Controller';
import LinkResolver from './_controller/LinkResolver';

/**
 * Получение инстанса контроллера тем, необходимого для скачивания/удаления/коллекции/переключения тем на странице
 * @public
 */
export const getThemeController = Controller.getInstance;
export { THEME_TYPE, EMPTY_THEME, DEFAULT_THEME } from './_controller/css/const';
export { LinkResolver }