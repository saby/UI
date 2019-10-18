/// <amd-module name="UI/_base/HTML" />

// @ts-ignore
import Control from './Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/HTML');
// @ts-ignore
import {constants, detection} from 'Env/Env';
// @ts-ignore
import ThemesController = require('Core/Themes/ThemesController');
// @ts-ignore
import LinkResolver = require('Core/LinkResolver/LinkResolver');

import * as AppEnv from 'Application/Env';
import AppData from './AppData';

class HTML extends Control {
    _template: Function = template;

    private onServer: Boolean = false;
    private isCompatible: Boolean = false;
    private compat: Boolean = false;
    private RUMEnabled: Boolean = false;
    private pageName: string = '';

    private title: string = '';
    private templateConfig: any = null;
    private buildnumber: string = '';
    private appRoot: string = '';
    private staticDomains: string = '[]';
    private wsRoot: string = '';
    private resourceRoot: string = '';
    private servicesPath: string = '';
    private application: string = '';
    private product: string = '';
    private linkResolver: any = null;

    private initState(cfg: any): void {
        this.title = cfg.title;
        this.templateConfig = cfg.templateConfig;
        this.compat = cfg.compat || false;
    }

    _beforeMount(cfg: any, context: any, receivedState: any): Promise<any> {
        this.onServer = typeof window === 'undefined';
        this.isCompatible = cfg.compat;
        this.initState(receivedState || cfg);
        if (!receivedState) {
            receivedState = {};
        }

        let appData = AppData.getAppData();

        this.buildnumber = cfg.buildnumber || constants.buildnumber;

        this.appRoot = cfg.appRoot || appData.appRoot || (cfg.builder ? '/' : constants.appRoot);

        this.RUMEnabled = cfg.RUMEnabled || appData.RUMEnabled || false;
        this.pageName = cfg.pageName || appData.pageName || false;

        this.staticDomains = cfg.staticDomains || appData.staticDomains || constants.staticDomains || '[]';
        if (typeof this.staticDomains !== 'string') {
            this.staticDomains = '[]';
        }

        this.resourceRoot = cfg.resourceRoot || constants.resourceRoot;
        this.product = cfg.product || appData.product || constants.product;
        this.wsRoot = cfg.wsRoot || appData.wsRoot || constants.wsRoot;

        // TODO нужно удалить после решения
        // https://online.sbis.ru/opendoc.html?guid=a9ceff55-1c8b-4238-90a7-22dde0e1bdbe
        this.servicesPath =
            cfg.servicesPath || appData.servicesPath || constants.defaultServiceUrl || '/service/';
        this.application = appData.application;

        if (typeof window === 'undefined' && cfg.theme !== 'default') {
            ThemesController.getInstance().themes = {};
            ThemesController.getInstance().setTheme(cfg.theme);
        }
        const headData = AppEnv.getStore('HeadData');

        this.linkResolver = new LinkResolver(
            headData.isDebug,
            this.buildnumber,
            this.wsRoot,
            this.appRoot,
            this.resourceRoot
        );

        // LinkResolver.getInstance().init(context.headData.isDebug, self.buildnumber, self.appRoot, self.resourceRoot);

        headData.pushDepComponent(this.application, false);

        if (receivedState.csses && !headData.isDebug) {
            ThemesController.getInstance().initCss({
                themedCss: receivedState.csses.themedCss,
                simpleCss: receivedState.csses.simpleCss
            });
        }

        /**
         * Этот перфоманс нужен, для сохранения состояния с сервера, то есть,
         * cfg - это конфиг, который нам прийдет из файла роутинга и с ним же надо
         * восстанавливаться на клиенте.
         */
        // Не будем возвращать промис в билдере, потому что там используется GeneratorCompatible
        // Он вставляет конфиги сразу после контрола, а не через StateReceiver. По-другому сейчас не сделать, т.к.
        // функция generatorCompatible решает, какой генератор вернуть? только по константам, а не по аргументам.
        // https://git.sbis.ru/sbis/ws/blob/rc-20.1000/View/Executor/TClosure.ts#L296
        if(!_options.builder && !_options.builderCompatible) {
            return new Promise((resolve) => {
                resolve({
                    buildnumber: this.buildnumber,
                    csses: ThemesController.getInstance().getCss(),
                    title: this.title,
                    appRoot: this.appRoot,
                    staticDomains: this.staticDomains,
                    RUMEnabled: this.RUMEnabled,
                    pageName: this.pageName,
                    wsRoot: this.wsRoot,
                    resourceRoot: this.resourceRoot,
                    templateConfig: this.templateConfig,
                    servicesPath: this.servicesPath,
                    compat: this.compat,
                    product: this.product
                });
            });
        }
    }

    _afterMount(): void {
        function inIframe() {
            try {
                return window.self !== window.top;
            } catch (e) {
                // Browsers can block access to window.top due to same origin policy.
                return true;
            }
        }

        // We don't know how UI/Base:HTML should behave inside iframe,
        // because we don't know what tasks UI/Base:HTML must solve inside of the iframe
        // You should activate UI/Base:HTML manually(by calling activate() method, for example) if you need it
        if (!detection.isMobilePlatform && !inIframe()) {
            this.activate();
        }
    }

    static contextTypes(): { AppData: any } {
        return {
            AppData
        };
    }
}

export default HTML;
