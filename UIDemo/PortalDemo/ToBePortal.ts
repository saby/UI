import {
    Control,
    IControlOptions,
    TemplateFunction
} from 'UI/Base';

import * as template from 'wml!UIDemo/PortalDemo/ToBePortal';
import 'UIDemo/ReactDemo/Compatible/Pure';

interface IPortalOptions extends IControlOptions {
    openerContainer: HTMLElement;
}

export default class ToBePortal extends Control<IPortalOptions> {
    _template: TemplateFunction = template;
}
