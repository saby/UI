import {
    Control,
    TemplateFunction
} from 'UI/Base';

import * as template from 'wml!UIDemo/PortalDemo/Index';

export default class PortalDemoIndex extends Control {
    _template: TemplateFunction = template;
    showPortal: boolean = false;
    _afterMount(): void {
        this.toggle();
    }
    toggle(): void {
        this.showPortal = !this.showPortal;
    }
}
