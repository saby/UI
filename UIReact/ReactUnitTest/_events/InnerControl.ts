import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/_events/InnerControl';

export default class TestControl extends Control {
    _template: TemplateFunction = template;
}
