/// <amd-module name="UI/_base/HTML/Head" />

import Control from '../Control';

/* tslint:disable:deprecated-anywhere */
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/HTML/Head');
import { getThemeController, EMPTY_THEME, THEME_TYPE } from 'UI/theme/controller';
import { constants } from 'Env/Env';
import { Head as AppHead } from 'Application/Page';
import { getResourceUrl } from 'UI/Utils';
import { headDataStore } from 'UI/_base/HeadData';
import { TemplateFunction, IControlOptions } from 'UI/Base';
import { default as TagMarkup } from 'UI/_base/HTML/_meta/TagMarkup';
import { fromJML } from 'UI/_base/HTML/_meta/JsonML';
import { JML } from 'UI/_base/HTML/_meta/interface';
import { handlePrefetchModules } from 'UI/_base/HTML/PrefetchLinks';

class Head extends Control<IHeadOptions> {
    _template: TemplateFunction = template;

    head: Function[] = null;
    headAdditiveTagsMarkup: string = '';
    headApiData: string = '';

    // Содержит информацию о том, был ли серверный рендеринг
    // Будет true, если мы строимся на клиенте и серверная верстка есть.
    // Наличие серверной верстки определяется по тому, нашли ли в DOM элемент с классом .head-server-block
    wasServerSide: boolean;
    // Содержит информацию о том, строимся ли мы на сервере или на клиенте. Нам необходимы оба этих флага,
    // потому что поведение контрола head должно быть разное на сервере и на клиенте.
    // Также оно должно быть разное на клиенте при наличии или отсутствии серверное верстки.
    isSSR: boolean;

    staticDomainsstringified: string = '[]';

    _beforeMount(options: IHeadOptions): Promise<void> {
        this.isSSR = !constants.isBrowserPlatform;
        /** Написано Д. Зуевым в 2019 году. Просто перенес при реструктуризации. */
        if (typeof options.staticDomains === 'string') {
            this.staticDomainsstringified = options.staticDomains;
        } else if (options.staticDomains instanceof Array) {
            this.staticDomainsstringified = JSON.stringify(options.staticDomains);
        }
        this.head = options.head;
        this.headAdditiveTagsMarkup = applyHeadJSON(options);

        this._selfPath();
        this._createHEADTags(options);

        if (!this.isSSR) {
            return;
        }
        return headDataStore.read('waitAppContent')()
            .then(({ js, css }) => {
                return new Promise<void>((resolve) => {
                    collectCSS(options.theme, css.simpleCss, css.themedCss)
                        .then(() => { resolve(); })
                        .catch((error) => { onerror(error); resolve(); });
                }).then(() => {
                    handlePrefetchModules(js);
                    /**
                     * Опросим HEAD API на предмет накопленного результата. Он будет массивом JML.
                     * Обработаем и добавим его к headApiData
                     * Напоминаю, что HEAD API это накопитель. Его дергают на протяжение всего процесса построения страницы
                     */
                    const data = AppHead.getInstance().getData();
                    if (data && data.length) {
                        this.headApiData += new TagMarkup(data.map(fromJML), {getResourceUrl: false}).outerHTML;
                    }
                    AppHead.getInstance().clear();
                });
            });
    }

    /**
     * При SPA переходе может поменяться, например, набор шрифтов для предзагрузки.
     * @param options
     * @protected
     */
    protected _beforeUpdate(options?: IHeadOptions): void {
        createMetaScriptsAndLinks(options);
    }

    /**
     * Манки патчинг.
     * Зачем-то на инстансе перебивается метод _forceUpdate с прототипа
     * Но сделал это человек, который придумал Wasaby. Ему видней.
     */
    private _selfPath(): void {
        /** Написано Д. Зуевым в 2019 году. Просто перенес при реструктуризации. */
        // tslint:disable-next-line:only-arrow-functions
        this._forceUpdate = function(): void {
            // do nothing
        };
    }

    /**
     * Проверим: была ли серверная верстка.
     */
    _createHEADTags(options: IHeadOptions): void {
        this.wasServerSide = false;
        if (!this.isSSR) {
            // tslint:disable-next-line:max-line-length
            // Проверяем наличие серверной верстки, чтобы решить, нужно ли нам рендерить ссылки на ресурсы внутри тега <head>.
            // Если серверная верстка была, то никакие ссылки больше рендериться не будут.
            // А на всех ссылках, пришедших с сервера, будет висеть атрибут data-vdomignore.
            // Из-за этого инферно не будет учитывать их при пересинхронизации. Это сделано для того,
            // tslint:disable-next-line:max-line-length
            // чтобы инферно ни в каком случае не стал перерисовывать ссылки, т.к. это приводит к "морганию" стилей на странице.
            if (document.getElementsByClassName('head-server-block').length > 0) {
                this.wasServerSide = true;
            }

            if (document.getElementsByClassName('head-custom-block').length > 0) {
                this.head = undefined;
            }
        }
        if (this.wasServerSide) {
            return;
        }
        const API = AppHead.getInstance();
        if (!options.compat) {
            API.createTag('script', {type: 'text/javascript'},
                `window.themeName = '${options.theme || options.defaultTheme || ''}';`
            );
        }
        API.createNoScript(options.noscript);
        const metaAttrs = [
            {'http-equiv': 'X-UA-Compatible', content: 'IE=edge'},
            {charset: 'utf-8', class: 'head-server-block'}
        ];
        /** Возможно, кто-то уже добавил viewport */
        const viewPort = API.getTag('meta', {name: 'viewport'});
        /** Если не нашли тег, или если нашли очень много, добавим свой */
        if (!viewPort || (viewPort instanceof Array)) {
            metaAttrs.push({name: 'viewport', content: options.viewport || 'width=1024'});
        }
        metaAttrs.forEach((attrs) => {
            API.createTag('meta', attrs);
        });
        createWsConfig(options, this.staticDomainsstringified);
        createMetaScriptsAndLinks(options);
    }

    // tslint:disable-next-line:ban-ts-ignore
    // @ts-ignore
    _shouldUpdate(): Boolean {
        return false;
    }

    // tslint:disable-next-line:no-any
    isArray(obj: any): Boolean {
        return Array.isArray(obj);
    }

    static getDefaultOptions(): IHeadOptions {
        return {
            wsRoot: 'no_ws_root',
            resourceRoot: 'no_resource_root',
            appRoot: 'no_app_root',
            RUMEnabled: false,
            pageName: 'no_page_name',
            compat: false,
            head: [],
            headJson: [],
            staticDomains: [],
            buildnumber: 'no_build_number',
            noscript: '',
            viewport: '',
            preInitScript: '',
            builder: false,
            servicesPath: 'no_service_path',
            product: 'no_product'
        };
    }
}

Object.defineProperty(Head, 'defaultProps', {
   enumerable: true,
   configurable: true,

   get(): object {
      return Head.getDefaultOptions();
   }
});

export default Head;

function collectCSS(theme: string, styles: string[] = [], themes: string[] = []): Promise<string> {
    const tc = getThemeController();
    const gettingStyles = styles.filter((name) => !!name).map((name) => tc.get(name, EMPTY_THEME));
    const gettingThemes = themes.filter((name) => !!name).map((name) => tc.get(name, theme, THEME_TYPE.SINGLE));
    return Promise.all(gettingStyles.concat(gettingThemes)).then();

}

function onerror(e: Error): void {
    import('UI/Utils').then(({ Logger }) => { Logger.error(e.message); });
}

function prepareMetaScriptsAndLinks(tag: string, attrs: object): object {
    return {
        tag,
        attrs
    };
}

/**
 * Подготовка когфига, который прилетит с сервака на клиент
 * wsConfig нет смысла рендерить на клиенте.
 * Он обязательно должен прийти с сервера.
 * Потому что необходим для загрузки ресурсов
 * @param options
 */
function createWsConfig(options: IHeadOptions, staticDomainsstringified: string): void {
    if (constants.isBrowserPlatform) {
        return;
    }

    const API = AppHead.getInstance();
    API.createTag('script', {type: 'text/javascript'},
        [
            'window.wsConfig = {',
            `wsRoot: '${options.wsRoot}',`,
            `resourceRoot: '${options.resourceRoot}',`,
            `appRoot: '${options.appRoot}',`,
            `RUMEnabled: ${options.RUMEnabled},`,
            `pageName: '${options.pageName}',`,
            'userConfigSupport: true,',
            `staticDomains: ${staticDomainsstringified},`,
            `defaultServiceUrl: '${options.servicesPath}',`,
            `compatible: ${options.compat},`,
            `product: '${options.product}',`,
            `reactApp: ${options.reactApp}`,
            '};',
            options.buildnumber ? `window.buildnumber = '${options.buildnumber}';` : '',
            options.preInitScript ? options.preInitScript : ''
        ].join('\n')
    );
}

/**
 * Применим опции meta, scripts и links к странице
 * @param options
 */
function createMetaScriptsAndLinks(options: IHeadOptions): void {
    const API = AppHead.getInstance();
    []
        .concat((options.meta || []).map(prepareMetaScriptsAndLinks.bind(null, 'meta')))
        .concat((options.scripts || []).map(prepareMetaScriptsAndLinks.bind(null, 'script')))
        .concat((options.links || []).map(prepareMetaScriptsAndLinks.bind(null, 'link')))
        .forEach((item: {tag: string, attrs: object}) => {
            ['href', 'src'].forEach((field) => {
                if (item.attrs[field]) {
                    item.attrs[field] = getResourceUrl(item.attrs[field])
                }
            });
            API.createTag(item.tag, item.attrs);
        });
}
/**
 * Поддержка старой опции
 * Запустил процесс отказа от нее
 * https://online.sbis.ru/opendoc.html?guid=fe14fe59-a564-4904-9a87-c38a5a22b924
 * @param options
 * @deprecated
 */
function applyHeadJSON(options: IHeadOptions): string {
    /** Deprecated опция в формате JML.Нет смысла гнать ее через HEAD API */
    if (options.headJson) {
        const tagDescriptions = options.headJson
            .map(fromJML)
            // не вставляем переданные link css, это обязанность theme_controller'a
            .filter(({ attrs }) => attrs.rel !== 'stylesheet' && attrs.type !== 'text/css');
        return new TagMarkup(tagDescriptions).outerHTML;
    }
}

interface IHeadOptions extends IControlOptions {
    defaultTheme?: string;
    wsRoot: string;
    resourceRoot: string;
    appRoot: string;
    RUMEnabled: boolean;
    pageName: string;
    compat: boolean;
    head: TemplateFunction[];
    headJson: JML[];
    staticDomains: string | string[];
    buildnumber: string;
    noscript: string;
    viewport: string;
    preInitScript: string;
    builder: boolean;
    servicesPath: string;
    product: string;
    meta?: Object[];
    links?: Object[];
    scripts?: Object[];
    reactApp?: boolean;
}
