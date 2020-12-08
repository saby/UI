import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_tabsDemo/NetworkRestoreTabs/Tab1');

class Tab1 extends Control {
    _template: TemplateFunction = template;
}

export = Tab1;
