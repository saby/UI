/// <amd-module name='UICommon/theme/controller' />
/**
 * Библиотека контроллера тем
 * @remark
 * Контроллер управляет загрузкой/удалением стилей всех контроллов на wasaby-странице на клиенте и СП
 * Подробнее о работе с темами оформления читайте {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/themes/ здесь}.
 * @library UICommon/theme/controller
 * @includes getThemeController UICommon/theme/_controller/Controller#getInstance
 * @includes THEME_TYPE UICommon/theme/_controller/css/const#THEME_TYPE
 * @includes EMPTY_THEME UICommon/theme/_controller/css/const#EMPTY_THEME
 * @includes DEFAULT_THEME UICommon/theme/_controller/css/const#DEFAULT_THEME
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
export { LinkResolver };
