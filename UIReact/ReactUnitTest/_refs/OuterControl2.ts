import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/_refs/OuterControl2';
import * as React from 'react';
import InnerControl from 'ReactUnitTest/_refs/InnerControl';

export default class TestControl extends Control {
    _template: TemplateFunction = template;

    elementRef: React.LegacyRef<HTMLElement>;
    controlRef: React.LegacyRef<InnerControl>;
    elementResult: HTMLElement;
    controlResult: InnerControl;

    protected _beforeMount(options?: {}, contexts?: object, receivedState?: void): Promise<void> | void {
        this.elementRef = (node) => {
            this.elementResult = node;
        };
        this.controlRef = (node) => {
            this.controlResult = node;
        };
        return super._beforeMount(options, contexts, receivedState);
    }
}
