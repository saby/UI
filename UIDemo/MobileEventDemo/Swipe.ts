/// <amd-module name="UIDemo/MobileEventDemo/Swipe" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/MobileEventDemo/Swipe');

class Swipe extends Control {
    public _template: Function = template;

    private swipeCount: number = null;
    private tapCount: number = null;

    _beforeMount() {
        this.swipeCount = 0;
        this.tapCount = 0;
    }

    private simpleClick() {
        this.tapCount += 1;
    }

    private swipe() {
        this.swipeCount += 1;
    }
}

Swipe._styles = ['UIDemo/MobileEventDemo/MobileEventDemo'];

export = Swipe;
