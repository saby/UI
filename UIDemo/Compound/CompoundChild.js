define('UIDemo/Compound/CompoundChild', [
   'Lib/Control/CompoundControl/CompoundControl',
   'wml!UIDemo/Compound/CompoundChild'
], function(Control, dotTplFn) {
   'use strict';

   var CompoundChild = Control.extend({
      $protected: {
         _options: { }
      },
      _dotTplFn: dotTplFn,
      $constructor: function() { }
   });

   return CompoundChild;
});
