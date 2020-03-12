/// <amd-module name="UIDemo/theme/Index" />

import { Control } from 'UI/Base';
// @ts-ignore
import template = require('wml!UIDemo/theme/Index');

class Index extends Control {
   theme1 = 'theme1';
   theme2 = 'theme1';
   _template = template;
   switchFirst() {
      this.theme1 = this.theme1 === 'theme1' ? 'theme2' : 'theme1';
   }
   switchSecond() {
      this.theme2 = this.theme2 === 'theme1' ? 'theme2' : 'theme1';
   }
}
export default Index;

