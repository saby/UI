/// <amd-module name="UI/_base/Document" />

import Control from './Control';

// @ts-ignore
import template = require('wml!UI/_base/Document/Document');

// @ts-ignore
import ThemesController = require('Core/Themes/ThemesController');
import * as AppEnv from 'Application/Env';
import { headDataStore } from 'UI/_base/HeadData';
import AppData from './AppData';
import startApplication from 'UI/_base/startApplication';

class Document extends Control {
    _template = template;

    private ctxData: any = null;
    private application: string = '';
    private applicationForChange: string = '';

    private coreTheme: string = '';

    constructor(cfg = {}) {
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

        startApplication(cfg);
        // Временно положим это в HeadData, потом это переедет в константы реквеста
        // Если запуск страницы начинается с UI/Base:Document, значит мы находимся в новом окружении
        headDataStore.write('isNewEnvironment', true);
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
            headDataStore.read('resetRenderDeferred')();
            this._forceUpdate();
            result = true;
        } else {
            result = false;
        }
        return result;
    }
}

export default Document;
