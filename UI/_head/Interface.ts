/**
 * Интерфейс для контролов, поддерживающих конфигурацию <a href="/doc/platform/developmentapl/middleware/preprocessor/">сервиса представления</a> приложения.
 * @interface UI/_head/Interface:IRootTemplateOptions
 * @author Санников К.А.
 */

/**
 * @name UI/_head/Interface:IRootTemplateOptions#buildnumber
 * @cfg {string} Номер сборки. Прибавляется ко всем url при запросах к серверу.
 * Используется при кешировании. Если меняется номер сборки,
 * все файлы начинают тянуться с сервера, а не из кеша браузера, потому что у них становится другой url.
 */

/**
 * @name UI/_head/Interface:IRootTemplateOptions#product
 * @cfg {string}
 */

/**
 * @name UI/_head/Interface:IRootTemplateOptions#wsRoot
 * @cfg {String} Путь к корню интерфейсного модуля WS.Core. Например, "/resources/WS.Core/".
 * @remark
 * Значение опции задаётся относительно URL-адреса сервиса.
 * URL-адрес сервиса устанавливается через <a href="/doc/platform/developmentapl/middleware/cloud-control/">Сервис управления облаком</a> в разделе "Структура облака".
 * Данная настройка попадает в свойство wsRoot объекта window.wsConfig.
 */

/**
 * @name UI/_head/Interface:IRootTemplateOptions#resourceRoot
 * @cfg {String} Адрес к директории с ресурсами сервиса. Например, "/resources/".
 * @remark
 * Значение опции задаётся относительно URL-адреса сервиса.
 * URL-адрес сервиса устанавливается через <a href="/doc/platform/developmentapl/middleware/cloud-control/">Сервис управления облаком</a> в разделе "Структура облака".
 * Данная настройка попадает в свойство resourceRoot объекта window.wsConfig.
 */

/**
 * @name UI/_head/Interface:IRootTemplateOptions#appRoot
 * @cfg {String} Адрес к директории сервиса. Например, "/".
 * @remark
 * Значение опции задаётся относительно URL-адреса сервиса.
 * URL-адрес сервиса устанавливается через <a href="/doc/platform/developmentapl/middleware/cloud-control/">Сервис управления облаком</a> в разделе "Структура облака".
 * Данная настройка попадает в свойство appRoot объекта window.wsConfig.
 */

/**
 * @name UI/_head/Interface:IRootTemplateOptions#staticDomains
 * @cfg {Array} Список, содержащий набор доменов для загрузки статики.
 * Список доменов решает задачу загрузки статических ресурсов с нескольких документов. Эти домены будут использоваться для создания путей для статических ресурсов и распределения загрузки для нескольких статических доменов.
 */

/**
 * @name UI/_head/Interface:IRootTemplateOptions#servicesPath
 * @cfg {string} Имя по-умолчанию для обращения к сервисам бизнес-логики
 * Данная настройка попадает в свойство defaultServiceUrl объекта window.wsConfig.
 */

interface IRootTemplateOptions {
    buildnumber?: string;
    product?: string;
    wsRoot?: string;
    resourceRoot?: string;
    appRoot?: string;
    staticDomains?: string[];
    servicesPath?: string;
    pageName?: string;
    RUMEnabled?: boolean;
}

/**
 * Интерфейс описывающий опции, которые необходимы при формировании содержимого head и скриптов страницы
 * @interface UI/_head/Interface:IHeadOptions
 * @public
 */
export interface IHeadOptions extends IRootTemplateOptions {
    defaultTheme?: string;
    theme?: string;
    noscript?: string;
    preInitScript?: string;
    reactApp?: boolean;
    meta?: Object[];
    links?: Object[];
    scripts?: Object[];
}
