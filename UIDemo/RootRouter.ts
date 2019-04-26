/// <amd-module name="UIDemo/Index" />

import BaseControl = require('Core/Control');

// @ts-ignore
import template = require('wml!UIDemo/RootRouter');

var Index = BaseControl.extend({
    _template: template,
});

export default Index;
