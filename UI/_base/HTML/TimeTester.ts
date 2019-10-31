/// <amd-module name="UI/_base/HTML/TimeTester" />

import Control from '../Control';

// @ts-ignore
import template = require('wml!UI/_base/HTML/TimeTester');

class TimeTester extends Control {
    //@ts-ignore
    _template: Function = template;
    boomerangInitialized: boolean;
    RUMEnabled: boolean;
    protected _beforeMount(opts): void {
        //@ts-ignore
        this.boomerangInitialized = typeof BOOMR === 'undefined';
        if (!this.boomerangInitialized) {
            this.RUMEnabled = (opts.RUMEnabled === 'true' || opts.RUMEnabled === true);
         }
    };
    public canAcceptFocus(): boolean {
        return false;
    };
}