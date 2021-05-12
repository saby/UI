define('ReactUnitTest/MarkupSpecification/scope/twoRootsControl',
   [
      'UI/Base',
      'wml!ReactUnitTest/MarkupSpecification/scope/twoRootsControl'
   ], function(Base, template) {
      'use strict';

      var Control = Base.Control.extend(
         {
            _template: template
         }
      );
      return Control;
   });
