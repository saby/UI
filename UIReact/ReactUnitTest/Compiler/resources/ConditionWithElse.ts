import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/Compiler/resources/ConditionWithElse';

export default class ConditionWithElse extends Control {
    _template: TemplateFunction = template;
}
