/// <amd-module name="UIDemo/ThemesDemo/ThemedControl" />

import { Control } from 'UI/Base';

// @ts-ignore
import template = require('wml!UIDemo/ThemesDemo/ThemedControl');

export default class ThemedControl extends Control {
    _template = template;
    static _theme = ['UIDemo/ThemesDemo/ThemedControl'];
}
