/// <amd-module name="UI/_base/HTML/Head" />

import Control from '../Control';

/* tslint:disable:deprecated-anywhere */
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/HTML/Head');
import { constants } from 'Env/Env';
import { Head as AppHead } from 'Application/Page';
import { createWsConfig, createDefaultTags, createMetaScriptsAndLinks, applyHeadJson } from "UI/Head";
import { aggregateCSS, headDataStore, handlePrefetchModules } from "UI/Deps";
import { TemplateFunction, IControlOptions } from 'UI/Base';
import { default as TagMarkup } from 'UI/_base/HTML/_meta/TagMarkup';
import { fromJML } from 'UI/_base/HTML/_meta/JsonML';
import { JML } from 'UI/_base/HTML/_meta/interface';

class Head extends Control<IHeadOptions> {
    _template: TemplateFunction = template;

    head: Function[] = null;
    headApiData: string = '';

    // Содержит информацию о том, был ли серверный рендеринг
    // Будет true, если мы строимся на клиенте и серверная верстка есть.
    // Наличие серверной верстки определяется по тому, нашли ли в DOM элемент с классом .head-server-block
    wasServerSide: boolean;
    // Содержит информацию о том, строимся ли мы на сервере или на клиенте. Нам необходимы оба этих флага,
    // потому что поведение контрола head должно быть разное на сервере и на клиенте.
    // Также оно должно быть разное на клиенте при наличии или отсутствии серверное верстки.
    isSSR: boolean;

    _beforeMount(options: IHeadOptions): Promise<void> {
        this.isSSR = !constants.isBrowserPlatform;
        this.head = options.head;

        this._selfPath();
        this._createHEADTags(options);

        if (!this.isSSR) {
            return;
        }
        return headDataStore.read('waitAppContent')()
            .then(({ js, css }) => {
                return new Promise<void>((resolve) => {
                    aggregateCSS(options.theme, css.simpleCss, css.themedCss)
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

        createDefaultTags(options);
        createWsConfig(options);
        createMetaScriptsAndLinks(options);
        applyHeadJson(options.headJson);
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

function onerror(e: Error): void {
    import('UI/Utils').then(({ Logger }) => { Logger.error(e.message); });
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
    staticDomains: string[];
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
