import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/ContentOptions/Component';

export default class Component extends Control {
    protected _template: TemplateFunction = template;
}