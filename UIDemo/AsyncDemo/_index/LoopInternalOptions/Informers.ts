import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_index/LoopInternalOptions/Informers');

export default class Informers extends Control {
    _template: TemplateFunction = template;
}
