define('Controls-demo/CompatibleDemo/Compat/Demo',
   [
      'Lib/Control/CompoundControl/CompoundControl',
      'wml!Controls-demo/CompatibleDemo/Compat/Demo',
      'css!Controls-demo/CompatibleDemo/CompatibleDemo'
   ],
   function(CompoundControl, template) {
      'use strict';

      var CompatibleDemo = CompoundControl.extend({
         _dotTplFn: template,

         init: function() {
            CompatibleDemo.superclass.init.call(this);
         },
         destroy: function() {
            CompatibleDemo.superclass.destroy.apply(this, arguments);
         }
      });
      return CompatibleDemo;
   }
);
