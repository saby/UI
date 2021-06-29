import {
    Control,
    TemplateFunction
} from 'UI/Base';

import * as template from 'wml!UIDemo/PortalDemo/Index';

export default class PortalDemoIndex extends Control {
    _template: TemplateFunction = template;
    showPortal: boolean = false;
    showOpener: boolean = true;
    _afterMount(): void {
        this.togglePortal();
    }
    togglePortal(): void {
        this.showPortal = !this.showPortal;
    }
    toggleOpener(): void {
        this.showOpener = !this.showOpener;
    }
}
