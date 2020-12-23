/**
 * Интерфейс для контролов, поддерживающих конфигурацию <a href="/doc/platform/developmentapl/middleware/preprocessor/">сервиса представления</a> приложения.
 * @interface UI/_base/interface/IRootTemplate
 * @public
 * @author Санников К.А.
 */

/**
 * @name UI/_base/interface/IRootTemplate#buildnumber
 * @cfg {string} Номер сборки. Прибавляется ко всем url при запросах к серверу.
 * Используется при кешировании. Если меняется номер сборки,
 * все файлы начинают тянуться с сервера, а не из кеша браузера, потому что у них становится другой url.
 */

/**
 * @name UI/_base/interface/IRootTemplate#product
 * @cfg {string}
 */

/**
 * @name UI/_base/interface/IRootTemplate#wsRoot
 * @cfg {String} Путь к корню интерфейсного модуля WS.Core. Например, "/resources/WS.Core/".
 * @remark
 * Значение опции задаётся относительно URL-адреса сервиса.
 * URL-адрес сервиса устанавливается через <a href="/doc/platform/developmentapl/middleware/cloud-control/">Сервис управления облаком</a> в разделе "Структура облака".
 * Данная настройка попадает в свойство wsRoot объекта window.wsConfig.
 */

/**
 * @name UI/_base/interface/IRootTemplate#wsRoot
 * @cfg {String} Path to ws root url
 */

/**
 * @name UI/_base/interface/IRootTemplate#resourceRoot
 * @cfg {String} Адрес к директории с ресурсами сервиса. Например, "/resources/".
 * @remark
 * Значение опции задаётся относительно URL-адреса сервиса.
 * URL-адрес сервиса устанавливается через <a href="/doc/platform/developmentapl/middleware/cloud-control/">Сервис управления облаком</a> в разделе "Структура облака".
 * Данная настройка попадает в свойство resourceRoot объекта window.wsConfig.
 */

/**
 * @name UI/_base/interface/IRootTemplate#resourceRoot
 * @cfg {String} Path to resource root url
 */

/**
 * @name UI/_base/interface/IRootTemplate#appRoot
 * @cfg {String} Адрес к директории сервиса. Например, "/".
 * @remark
 * Значение опции задаётся относительно URL-адреса сервиса.
 * URL-адрес сервиса устанавливается через <a href="/doc/platform/developmentapl/middleware/cloud-control/">Сервис управления облаком</a> в разделе "Структура облака".
 * Данная настройка попадает в свойство appRoot объекта window.wsConfig.
 */

/**
 * @name UI/_base/interface/IRootTemplate#appRoot
 * @cfg {String} Path to application root url
 */

/**
 * @name UI/_base/interface/IRootTemplate#staticDomains
 * @cfg {Array} Список, содержащий набор доменов для загрузки статики.
 * Список доменов решает задачу загрузки статических ресурсов с нескольких документов. Эти домены будут использоваться для создания путей для статических ресурсов и распределения загрузки для нескольких статических доменов.
 */

/**
 * @name UI/_base/interface/IRootTemplate#staticDomains
 * @cfg {Array} The list of domains for distributing static resources. These domains will be used to create paths
 * for static resources and distribute downloading for several static domains.
 */

/**
 * @name UI/_base/interface/IRootTemplate#servicesPath
 * @cfg {string} Имя по-умолчанию для обращения к сервисам бизнес-логики
 * Данная настройка попадает в свойство defaultServiceUrl объекта window.wsConfig.
 */

export interface IRootTemplate {
    readonly '[UI/_base/interface/IRootTemplate]': boolean;
}

export interface IRootTemplateOptions {
    buildnumber?: string;
    product?: string;
    wsRoot?: string;
    resourceRoot?: string;
    appRoot?: string;
    staticDomains: string[];
    servicesPath: string;
}
