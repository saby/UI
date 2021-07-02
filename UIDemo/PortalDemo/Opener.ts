import {
    Control,
    TemplateFunction
} from 'UI/Base';

import * as template from 'wml!UIDemo/PortalDemo/Opener';

export default class Opener extends Control {
    _template: TemplateFunction = template;
}
