import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_index/Index');

export default class Index extends Control {
    protected _template: TemplateFunction = template;

    protected showAsync: boolean = true;
    protected buttonCaption: string = 'Скрыть';

    protected toggleAsync(): void {
        this.showAsync = !this.showAsync;
        this.buttonCaption = this.showAsync ? 'Скрыть' : 'Показать';
    }

    static _styles: string[] = ['UIDemo/AsyncDemo/Index'];
}
