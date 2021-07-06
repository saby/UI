import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/Compiler/resources/OneRootWithAdditionalProps';

export default class OneRootWithAdditionalProps extends Control {
    _template: TemplateFunction = template;
}
