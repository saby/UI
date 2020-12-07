import { constants } from 'Env/Env';
import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_index/LoadModules');

export default class extends Control {
    protected _template: TemplateFunction = template;

    protected templateName1: string = 'UIDemo/AsyncDemo/testModuleNoLib';
    protected templateName2: string = 'UIDemo/AsyncDemo/testLib:testModule';
    protected isOK: string = 'false';

    protected _beforeMount(): void {
        if (constants.isBrowserPlatform) {
            let libModule: boolean = false;
            let noLibModule: boolean = false;
            const scripts = document.querySelectorAll('script');
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].src.indexOf('testLib')) {
                    libModule = true;
                }
                if (scripts[i].src.indexOf('testModuleNoLib')) {
                    noLibModule = true;
                }
            }
            if (libModule && noLibModule) {
                this.isOK = 'true';
            }
        }
    }
}
