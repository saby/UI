import {IControlOptions} from 'UICore/Base';

/**
 * Интерфейс для контролов, поддерживающих конфигурацию HTML-документа.
 * @interface UI/_base/interface/IHTML
 * @private
 * @author Санников К.А.
 */
export interface IHTML {
    readonly '[UI/_base/interface/IHTML]': boolean;
}

/**
 * @name UI/_base/interface/IHTML#head
 * @deprecated Используйте {@link UI/_base/interface/IHeadBase#headJson headJson}.
 * @cfg {Array} Дополнительное содержимое тега HEAD. Может принимать более одного корневого узла.
 */

/**
 * @name UI/_base/interface/IHTML#head
 * @deprecated Use {@link headJson} option from {@link UI/_base/interface/IHeadBase}.
 * @cfg {Array} Additional content of HEAD tag. Can accept more than one root node
 */

/**
 * @name UI/_base/interface/IHTML#beforeScripts
 * @cfg {Boolean} В значении true скрипты из опции {@link scripts} будут вставлены до других скриптов, созданных приложением.
 * @default false
 */

/**
 * @name UI/_base/interface/IHTML#beforeScripts
 * @cfg {Boolean} If it's true, scripts from options scripts will be pasted before other scripts generated by application
 * otherwise it will be pasted after.
 */

/**
 * @name UI/_base/interface/IHTML#viewport
 * @cfg {String} Атрибут содержимого мета-тега с именем "viewport".
 */

/**
 * @name UI/_base/interface/IHTML#viewport
 * @cfg {String} Content attribute of meta tag with name "viewport"
 */

/**
 * @name UI/_base/interface/IHTML#bodyClass
 * @cfg {String} Дополнительный CSS-класс, который будет задан для тега body.
 */

/**
 * @name UI/_base/interface/IHTML#bodyClass
 * @cfg {String} String with classes, that will be pasted in body's class attribute
 */

/**
 * @name UI/_base/interface/IHTML#templateConfig
 * @cfg {Object} Все поля из этого объекта будут переданы в опции контента.
 */

/**
 * @name UI/_base/interface/IHTML#templateConfig
 * @cfg {Object} All fields from this object will be passed to content's options
 */

/**
 * @name UI/_base/interface/IHTML#compat
 * @deprecated Способы вставки старых контролов внутри нового окружения описаны в этой статье: {@link /doc/platform/developmentapl/ws3/compound-wasaby/}
 * @cfg {Boolean} В значении true создаётся "слой совместимости" для работы с контролами из пространства имён SBIS3.CONTROLS и Lib.
 */

/**
 * @name UI/_base/interface/IHTML#compat
 * @deprecated There are several ways to use old controls in new environment: {@link /doc/platform/developmentapl/ws3/compound-wasaby/}.
 * @cfg {Boolean} If it's true, compatible layer will be loaded
 */

/**
 * @name UI/_base/interface/IHTML#builder
 * @cfg {Boolean} В значении true разрешено создание статической html-страницы через <a href="/doc/platform/developmentapl/development-tools/builder/#html_1">билдер</a>.
 * Необходимое условие создание таких страниц описано <a href="/doc/platform/developmentapl/interface-development/controls/controls-application/#static-html">здесь</a>.
 * @default false
 */

/**
 * @name UI/_base/interface/IHTML#builder
 * @cfg {Boolean} Allows to create static html with builder
 */

/**
 * @name UI/_base/interface/IHTML#builderCompatible
 * @cfg {Boolean} В значении true на странице загружается слой совместимости для работы с контролами из пространства имён SBIS3.CONTROLS и Lib.
 * Использование опции актуально, когда опция {@link builder} установлена в значение true.
 */

/**
 * @name UI/_base/interface/IHTML#builderCompatible
 * @cfg {Boolean} Will load compatible layer. Works only if builder option is true.
 */

/**
 * @name UI/_base/interface/IHTML#width
 * @cfg {String} Используется контролом Controls/popup:Manager.
 */

/**
 * @css @font-size_App__body Font size of page body. This size inherits to other elements in page.
 * @css @font-size_App__body Font size of page body. This size inherits to other elements in page.
 */

/**
 * @name UI/_base/interface/IHTML#width
 * @cfg {String} Used by Controls.popup:Manager
 */

export interface IHTMLOptions extends IControlOptions {
    head?: Function[] | Function;
    content?: Function;
    beforeScripts?: boolean;
    viewport?: string;
    bodyClass?: string;
    templateConfig?: object;
    compat?: boolean;
    builder?: boolean;
    builderCompatible?: boolean;
    width?: string;
}

export interface IScriptsAttrsHTML {
    src: string;
}
export interface ILinksAttrsHTML {
    href: string;
    type: string;
}
