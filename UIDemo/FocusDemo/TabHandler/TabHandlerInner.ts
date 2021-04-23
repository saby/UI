import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import template = require('wml!UIDemo/FocusDemo/TabHandler/TabHandlerInner');

interface ITabHandlerInner extends IControlOptions {
    rootTabindex: string | number;
}

export default class FocusTabHandlerInnerDemo extends Control<ITabHandlerInner> {
    protected _template: TemplateFunction = template;
}
