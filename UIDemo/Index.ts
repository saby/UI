/// <amd-module name="UIDemo/Index" />

import BaseControl = require('Core/Control');

// @ts-ignore
import template = require('wml!UIDemo/Index');

var Index = BaseControl.extend({
   _template: template,
});

Index._styles = ['UIDemo/Index'];

export = Index;