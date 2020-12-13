import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_tabsDemo/QuickClickTabs/Tab0');

class Tab0 extends Control {
    _template: TemplateFunction = template;
}

export = Tab0;
