define('UITest/MarkupSpecification/scope/oneDivTextMarkup', [
   'UI/Base',
   'wml!UITest/MarkupSpecification/scope/oneDivTextMarkup'
], function(Base, tmpl) {
   'use strict';

   var Control = Base.Control.extend({
      _template: tmpl
   });

   return Control;
});
