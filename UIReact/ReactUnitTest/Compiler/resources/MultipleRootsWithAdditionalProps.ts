import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/Compiler/resources/MultipleRootsWithAdditionalProps';

export default class MultipleRootsWithAdditionalProps extends Control {
    _template: TemplateFunction = template;
}
