import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/Compiler/resources/Condition';

export default class Condition extends Control {
    _template: TemplateFunction = template;
}
