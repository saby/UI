/// <amd-module name="UI/_base/HTML/Head" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/Head');
import { getThemeController, EMPTY_THEME, THEME_TYPE } from 'UI/theme/controller';
// @ts-ignore
import { constants } from 'Env/Env';
import { headDataStore } from 'UI/_base/HeadData';
import { Stack } from 'UI/_base/HTML/meta';
import { TemplateFunction, IControlOptions } from 'UI/Base';
import TagMarkup, { fromJML } from 'UI/_base/HTML/_meta/TagMarkup';
import { JML } from 'UI/_base/HTML/_meta/interface';

class Head extends Control<IHeadOptions> {
    _template: TemplateFunction = template;

    metaMarkup: string = Stack.getInstance().lastState.outerHTML;

    head: Function[] = null;
    headAdditiveTagsMarkup: string = '';

    // Содержит информацию о том, был ли серверный рендеринг
    // Будет true, если мы строимся на клиенте и серверная верстка есть.
    // Наличие серверной верстки определяется по тому, нашли ли в DOM элемент с классом .head-server-block
    wasServerSide: boolean;
    // Содержит информацию о том, строимся ли мы на сервере или на клиенте. Нам необходимы оба этих флага,
    // потому что поведение контрола head должно быть разное на сервере и на клиенте.
    // Также оно должно быть разное на клиенте при наличии или отсутствии серверное верстки.
    isSSR: boolean;

    staticDomainsstringified: string = '[]';

    /** html разметка подключенных на СП стилей */
    protected stylesHtml: string = '';

    _beforeMount(options: IHeadOptions): Promise<void> {
        // tslint:disable-next-line:only-arrow-functions
        this._forceUpdate = function (): void {
            // do nothing
        };

        if (typeof options.staticDomains === 'string') {
            this.staticDomainsstringified = options.staticDomains;
        } else if (options.staticDomains instanceof Array) {
            this.staticDomainsstringified = JSON.stringify(options.staticDomains);
        }

        this.head = options.head;
        const tagDescriptions = options.headJson
            .map(fromJML)
            // не вставляем переданные link css, это обязанность theme_controller'a
            .filter(({ attrs }) => attrs.rel !== "stylesheet" && attrs.type !== "text/css");
        this.headAdditiveTagsMarkup = new TagMarkup(tagDescriptions).outerHTML;

        this.wasServerSide = false;
        this.isSSR = !constants.isBrowserPlatform;
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
            return;
        }
        return headDataStore.read('waitAppContent')().then(({ css }) =>
            collectCSS(options.theme, css.simpleCss, css.themedCss)
                .then((html) => { this.stylesHtml = `\n${html}\n`; })
                .catch(onerror));
    }

    // @ts-ignore
    _shouldUpdate(): Boolean {
        return false;
    }

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
            product: 'no_product',
        };
    }
}

export default Head;

function collectCSS(theme: string, styles: string[] = [], themes: string[] = []): Promise<string> {
    const tc = getThemeController();
    const gettingStyles = styles.filter((name) => !!name).map((name) => tc.get(name, EMPTY_THEME));
    const gettingThemes = themes.filter((name) => !!name).map((name) => tc.get(name, theme, THEME_TYPE.SINGLE));
    return Promise.all(gettingStyles.concat(gettingThemes)).then(() => {
        const markup = tc.getAll().map((entity) => entity.outerHtml).join('\n');
        tc.clear();
        return markup;
    });

}

function onerror(e: Error): void {
    import('UI/Utils').then(({ Logger }) => { Logger.error(e.message); });
}

interface IHeadOptions extends IControlOptions {
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
}
