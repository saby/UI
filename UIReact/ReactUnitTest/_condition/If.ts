import {Control, TemplateFunction} from 'UI/Base';
// @ts-ignore
import * as template from 'wml!ReactUnitTest/_condition/If';

export default class If extends Control {
    protected _template: TemplateFunction = template;
}
