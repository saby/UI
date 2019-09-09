/// <amd-module name="UI/_base/Document" />

import Control from './Control';

// @ts-ignore
import template = require('wml!UI/_base/Document/Document');

// @ts-ignore
import ThemesController = require('Core/Themes/ThemesController');

import HeadData from './HeadData';
import StateReceiver from './StateReceiver';
import AppData from './AppData';

import { default as AppInit, isInit } from 'Application/Initializer';
import * as AppEnv from 'Application/Env';
// @ts-ignore
import PresentationService from 'SbisEnv/PresentationService';

class Document extends Control {
    _template: Function = template;

    private ctxData: any = null;
    private application: string = '';
    private applicationForChange: string = '';

    private coreTheme: string = '';

    constructor(cfg: any) {
        super(cfg);

        /*
        * Копипаста из Controls/Application/Core для сервиса представления.
        * TODO: Удалить либо эту копипасту, либо комментарий в задаче:
        * https://online.sbis.ru/opendoc.html?guid=bd7fb25b-fdde-4caf-8144-9cf8502713d0
        * */
        try {
            process.domain.req.compatible = false;
        } catch (e) {
        }

        if(!isInit()) {
            const stateReceiverInst = new StateReceiver();
            let environmentFactory;
            if (typeof window === 'undefined') {
                environmentFactory = PresentationService;
            }

            // @ts-ignore
            AppInit(cfg, environmentFactory, stateReceiverInst);

            if (typeof window === 'undefined') {
                // need create request for SSR
                // on client request will create in app-init.js
                if (typeof window !== 'undefined' && window.receivedStates) {
                    stateReceiverInst.deserialize(window.receivedStates);
                }
            }
        }

        const headData = new HeadData();
        // Временно положим это в HeadData, потом это переедет в константы реквеста
        // Если запуск страницы начинается с UI/Base:Document, значит мы находимся в новом окружении
        headData.isNewEnvironment = true;
        AppEnv.setStore('HeadData', headData);
        AppData.initAppData(cfg);
        AppEnv.setStore('CoreInstance', { instance: this });
        this.ctxData = new AppData(cfg);
        }

    _beforeMount(cfg: any): void {
        this.application = cfg.application;
    }

    _beforeUpdate(cfg: any): void {
        if (this.applicationForChange) {
            this.application = this.applicationForChange;
            this.applicationForChange = null;
        } else {
            this.application = cfg.application;
        }
    }

    // _getChildContext(): { AppData: any } {
    //     return {
    //         AppData: this.ctxData
    //     };
    // }

    setTheme(ev: Event, theme: string): void {
        this.coreTheme = theme;
        if (ThemesController.getInstance().setTheme) {
            ThemesController.getInstance().setTheme(theme);
        }
    }

    changeApplicationHandler(e: Event, app: string): Boolean {
        let result;
        if (this.application !== app) {
            this.applicationForChange = app;
            const headData = AppEnv.getStore('HeadData');
            if (headData) {
                headData.resetRenderDeferred();
            }
            this._forceUpdate();
            result = true;
        } else {
            result = false;
        }
        return result;
    }
}

export default Document;
