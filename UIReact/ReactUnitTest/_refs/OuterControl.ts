import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!ReactUnitTest/_refs/OuterControl';
import * as React from 'react';
import InnerControl from 'ReactUnitTest/_refs/InnerControl';

export default class OuterControl extends Control {
    _template: TemplateFunction = template;

    elementRef: React.RefObject<HTMLElement>;
    controlRef: React.RefObject<InnerControl>;

    protected _beforeMount(options?: {}, contexts?: object, receivedState?: void): Promise<void> | void {
        this.elementRef = React.createRef();
        this.controlRef = React.createRef();
        return super._beforeMount(options, contexts, receivedState);
    }
}
