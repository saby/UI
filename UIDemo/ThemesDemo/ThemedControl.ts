/// <amd-module name="UIDemo/Demo4_sub" />

// @ts-ignore
import BaseControl = require('Core/Control');

// @ts-ignore
import template = require('wml!UIDemo/ThemesDemo/ThemedControl');

var ThemedControl = BaseControl.extend({
    _template: template
});

ThemedControl._theme = ['UIDemo/ThemesDemo/ThemedControl'];

export = ThemedControl;
