define('UITest/MarkupSpecification/scope/twoRootsControl',
   [
      'UI/Base',
      'wml!UITest/MarkupSpecification/scope/twoRootsControl'
   ], function(Base, template) {
      'use strict';

      var Control = Base.Control.extend(
         {
            _template: template
         }
      );
      return Control;
   });
