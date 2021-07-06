import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/Compiler/resources/OneRoot';

export default class OneRoot extends Control {
    _template: TemplateFunction = template;
}
