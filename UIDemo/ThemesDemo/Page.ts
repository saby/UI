/// <amd-module name="UIDemo/Demo4" />

// @ts-ignore
import BaseControl = require('Core/Control');

// @ts-ignore
import template = require('wml!UIDemo/ThemesDemo/Page');

var Page = BaseControl.extend({
   _template: template,
   _beforeMount: function () {
      this.theme1 = 'theme1';
      this.theme2 = 'theme1';
   },
   switchFirst: function() {
      this.theme1 = this.theme1 === 'theme1' ? 'theme2' : 'theme1';
   },
   switchSecond: function() {
      this.theme2 = this.theme2 === 'theme1' ? 'theme2' : 'theme1';
   }
});

export = Page;
