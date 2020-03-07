/// <amd-module name="UIDemo/MobileEventDemo/LongTap" />

import {Control} from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/MobileEventDemo/LongTap');

class LongTap extends Control {
    public _template: Function = template;

    private longTapCount: number = null;
    private swipeCount: number = null;
    private tapCount: number = null;

    _beforeMount() {
        this.longTapCount = 0;
        this.swipeCount = 0;
        this.tapCount = 0;
    }

    private longClick() {
        this.longTapCount += 1;
    }

    private simpleClick() {
        this.tapCount += 1;
    }
    private swipe() {
        this.swipeCount += 1;
    }
}

LongTap._styles = ['UIDemo/MobileEventDemo/MobileEventDemo'];

export = LongTap;
