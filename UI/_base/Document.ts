/// <amd-module name="UI/_base/Document" />

import { Control } from 'UICore/Base';
import { TemplateFunction } from 'UICommon/Base';

// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import template = require('wml!UI/_base/Document/Document');
import { getThemeController } from 'UI/theme/controller';
import * as AppEnv from 'Application/Env';
import { headDataStore } from 'UI/Deps';
import { AppData } from 'UI/State';
import { startApplication } from 'UICore/Base';

class Document extends Control {
    _template: TemplateFunction = template;

    // tslint:disable-next-line:no-any
    private ctxData: any = null;
    private application: string = '';
    private applicationForChange: string = '';

    private coreTheme: string = '';

    /*
    FIXME: для реакта тут будет 2 параметра, и передавать надо оба.
    Пока в описании типа оставляю только первый, потому что это подходит под оба типа конструктора.
     */
    constructor(...args: [object]) {
        super(...args);
        const cfg = args[0];

        /*
        * Копипаста из Controls/Application/Core для сервиса представления.
        * TODO: Удалить либо эту копипасту, либо комментарий в задаче:
        * https://online.sbis.ru/opendoc.html?guid=bd7fb25b-fdde-4caf-8144-9cf8502713d0
        * */
        try {
            process.domain.req.compatible = false;
            // tslint:disable-next-line:no-empty
        } catch (e) {
        }

        startApplication(cfg);
        // Временно положим это в HeadData, потом это переедет в константы реквеста
        // Если запуск страницы начинается с UI/Base:Document, значит мы находимся в новом окружении
        headDataStore.write('isNewEnvironment', true);
        AppData.initAppData(cfg);
        this.ctxData = new AppData(cfg);
    }

    // tslint:disable-next-line:no-any
    _beforeMount(cfg: any): void {
        this.application = cfg.application;
    }

    // tslint:disable-next-line:no-any
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
        getThemeController()
            .setTheme(theme)
            .catch((e: Error) => {
                import('UI/Utils').then(({ Logger }) => {
                    Logger.error(e.message);
                });
            });
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

    static defaultProps: object = {
        notLoadThemes: true
    };
}

export default Document;
