import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_tabsDemo/TabsDemo');

// @TODO костыль - пока не разбирался, почему не тянутся стили из _styles
import 'css!UIDemo/AsyncDemo/_tabsDemo/TabsDemo';

export default class extends Control {
    protected _template: TemplateFunction = template;
    static _styles: string[] = ['UIDemo/AsyncDemo/_tabsDemo/TabsDemo'];
}
