import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/Compiler/resources/MultipleRoots';

export default class MultipleRoots extends Control {
    _template: TemplateFunction = template;
}
