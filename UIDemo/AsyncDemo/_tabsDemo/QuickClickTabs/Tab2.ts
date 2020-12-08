import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_tabsDemo/QuickClickTabs/Tab2');

class Tab2 extends Control {
    _template: TemplateFunction = template;
}

export = Tab2;
