import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/FocusDemo/Index');

export default class FocusDemo extends Control {
    protected _template: TemplateFunction = template;

    // Костыли, чтобы события фокуса и нажатия таба работали в React-Wasaby контролах
    // TODO Удалить после начала старта приложения от div внутри body.
    _afterMount(): void {
        // @ts-ignore
        const environment = this._getEnvironment();
        if (environment._rootDOMNode !== document.documentElement) {
            //@ts-ignore
            environment.constructor.call(environment,  document.documentElement, environment._controlStateChangedCallback);
            // @ts-ignore
            environment.eventSystem.addTabListener();
            this.activate();
        }
    }
    static _styles: string[] = ['UIDemo/FocusDemo/Index'];
}
