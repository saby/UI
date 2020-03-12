/// <amd-module name="UIDemo/theme/Foo" />

import { Control } from 'UI/Base';
// @ts-ignore
import template = require('wml!UIDemo/theme/template');

class Foo extends Control {
    _template = template;
    static _theme = ['UIDemo/theme/style'];
}
export default Foo;