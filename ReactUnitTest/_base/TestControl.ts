import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/_base/TestControl';

export interface ITestControlOptions extends IControlOptions {
    testOption?: string;
}

export default class TestControl extends Control<ITestControlOptions> {
    _template: TemplateFunction = template;

    static defaultProps: Partial<ITestControlOptions> = {
        testOption: '123'
    };
}
