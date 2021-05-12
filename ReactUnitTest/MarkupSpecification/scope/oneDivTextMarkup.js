define('ReactUnitTest/MarkupSpecification/scope/oneDivTextMarkup', [
   'UI/Base',
   'wml!ReactUnitTest/MarkupSpecification/scope/oneDivTextMarkup'
], function(Base, tmpl) {
   'use strict';

   var Control = Base.Control.extend({
      _template: tmpl
   });

   return Control;
});
