import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/Compiler/resources/ConditionWithAdditionalProps';

export default class ConditionWithAdditionalProps extends Control {
    _template: TemplateFunction = template;
}
