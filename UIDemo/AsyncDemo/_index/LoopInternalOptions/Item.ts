import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_index/LoopInternalOptions/Item');

export default class Item extends Control {
    _template: TemplateFunction = template;
}
