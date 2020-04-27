/// <amd-module name="UIDemo/RootRouter" />

import { Control, TemplateFunction } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/RootRouter');

class Index extends Control {
    _template: TemplateFunction = template;
}

export default Index;
