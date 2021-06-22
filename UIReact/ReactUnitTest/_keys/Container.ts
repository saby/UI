import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/_keys/Container';

export default class Container extends Control {
    _template: TemplateFunction = template;
    keys: number[] = [1, 2, 3, 4, 5];
}
