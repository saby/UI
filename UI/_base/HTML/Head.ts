/// <amd-module name="UI/_base/HTML/Head" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/Head');

import * as AppEnv from 'Application/Env';
import ThemesControllerNew = require('Core/Themes/ThemesControllerNew');

class Head extends Control {
    _template: Function = template;

    head: Function[] = null;
    headContent: Function[] = null;

    themedCss: string[] = [];
    simpleCss: string[] = [];

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

        /*Этот коммент требует английского рефакторинга
        * Сохраним пользовательские данные на инстанс
        * мы хотим рендерить их только 1 раз, при этом, если мы ренедрим их на сервере мы добавим класс
        * head-custom-block */
        this.head = options.head;
        this.headContent = options.headContent;

        this.wasServerSide = false;
        this.isSSR = typeof window === 'undefined';
        if (!this.isSSR) {

            /*всем элементам в head назначается атрибут data-vdomignore
            * то есть, inferno их не удалит, и если в head есть спец элементы,
            * значит мы рендерились на сервере и здесь сейчас оживаем, а значит пользовательский
            * контент уже на странице и генерировать второй раз не надо, чтобы не было синхронизаций
            * */

            if (document.getElementsByClassName('head-server-block').length > 0) {
                // Element with right class name is already existed in "_beforeMount" hook on client side.
                // All nodes in this block have true value of data-vdomignore attribute, so inferno never redraw them.
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
