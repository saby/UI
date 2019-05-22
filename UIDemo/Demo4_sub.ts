/// <amd-module name="UIDemo/Demo4_sub" />

import BaseControl = require('Core/Control');

// @ts-ignore
import template = require('wml!UIDemo/Demo4_sub');

import "css!theme?UIDemo/Demo4_sub";

var Demo4_sub = BaseControl.extend({
    _template: template
});

Demo4_sub._theme = ['UIDemo/Demo4_sub'];

export = Demo4_sub;
