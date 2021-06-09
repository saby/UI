import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/_base/ControlWithState';

export interface ITestControlOptions extends IControlOptions {
    testOption?: string;
}

export default class ControlWithState extends Control<ITestControlOptions> {
    _template: TemplateFunction = template;
    protected _someState: number = 0;
}
