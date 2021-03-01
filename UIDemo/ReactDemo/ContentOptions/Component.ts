import {Control, TemplateFunction} from 'UI/Base';
import * as template from 'wml!UIDemo/ReactDemo/ContentOptions/Component';

export default class LifecycleController extends Control {
    protected _template: TemplateFunction = template;

    constructor(...args: [object]) {
        super(...args);
    }
}
