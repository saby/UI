/// <amd-module name="UI/_base/HTML/Head" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/Head');

import * as AppEnv from 'Application/Env';
import { constants } from 'Env/Env';
import ThemesControllerNew = require('Core/Themes/ThemesControllerNew');

class Head extends Control {
    _template: Function = template;

    head: Function[] = null;
    headContent: Function[] = null;

    themedCss: string[] = [];
    simpleCss: string[] = [];

    // Содержит информацию о том, был ли серверный рендеринг
    // Будет true, если мы строимся на клиенте и серверная верстка есть.
    // Наличие серверной верстки определяется по тому, нашли ли в DOM элемент с классом .head-server-block
    wasServerSide: boolean;
    // Содержит информацию о том, строимся ли мы на сервере или на клиенте. Нам необходимы оба этих флага,
    // потому что поведение контрола head должно быть разное на сервере и на клиенте.
    // Также оно должно быть разное на клиенте при наличии или отсутствии серверное верстки.
    isSSR: boolean;

    staticDomainsstringified: string = '[]';

    _beforeMountLimited(): Promise<any> {
        // https://online.sbis.ru/opendoc.html?guid=252155de-dc95-402c-967d-7565951d2061
        // This component awaits completion of building content of _Wait component
        // So we don't need timeout of async building in this component
        // Because we need to build depends list in any case
        // before returning html to client
        return this._beforeMount.apply(this, arguments);
    }

    _beforeMount(options: any): Promise<any> {
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
        this.headContent = options.headContent;

        this.wasServerSide = false;
        this.isSSR = !constants.isBrowserPlatform;
        if (!this.isSSR) {
            // Проверяем наличие серверной верстки, чтобы решить, нужно ли нам рендерить ссылки на ресурсы внутри тега <head>.
            // Если серверная верстка была, то никакие ссылки больше рендериться не будут.
            // А на всех ссылках, пришедших с сервера, будет висеть атрибут data-vdomignore.
            // Из-за этого инферно не будет учитывать их при пересинхронизации. Это сделано для того,
            // чтобы инферно ни в каком случае не стал перерисовывать ссылки, т.к. это приводит к "морганию" стилей на странице.
            if (document.getElementsByClassName('head-server-block').length > 0) {
                this.wasServerSide = true;
            }

            if (document.getElementsByClassName('head-custom-block').length > 0) {
                this.head = undefined;
                this.headContent = undefined;
            }
            this.themedCss = [];
            this.simpleCss = [];
            return;
        }
        const headData = AppEnv.getStore('HeadData');
        const def = headData.waitAppContent();
        this.cssLinks = [];
        return new Promise((resolve, reject) => {
            def.then((res) => {
                this.newSimple = ThemesControllerNew.getInstance().getSimpleCssList();
                this.newThemed = ThemesControllerNew.getInstance().getThemedCssList();

                this.themedCss = res.css.themedCss;
                this.simpleCss = res.css.simpleCss;
                resolve();

            });
        });
    }

    _shouldUpdate(): Boolean {
        return false;
    }

    isArray(obj: any): Boolean {
        return Array.isArray(obj);
    }

    isMultiThemes(): Boolean {
        return Array.isArray(this._options.theme);
    }

    getCssWithTheme(value: string, theme: string): string {
        return value.replace('.css', '') + '_' + theme + '.css';
    }
}

export default Head;
