/// <amd-module name="UIDemo/ThemesDemo/Page" />

import { Control } from 'UI/Base';
// @ts-ignore
import template = require('wml!UIDemo/ThemesDemo/Page');

const LIGTH_THEME = 'default__light';
const DARK_THEME = 'default__dark';
const invertTheme = (theme: string) => (theme === LIGTH_THEME) ? DARK_THEME : LIGTH_THEME;

export default class Page extends Control {
   _template = template;
   theme1 = LIGTH_THEME;
   theme2 = LIGTH_THEME;
   switchFirst() {
      this.theme1 = invertTheme(this.theme1);
   }
   switchSecond() {
      this.theme2 = invertTheme(this.theme2);
   }
};
