define('UIDemo/CompatibleDemo/Compat/Wasaby/CreateControlWithValue/CreateControlWithValue', [
   'Lib/Control/CompoundControl/CompoundControl',
   'wml!UIDemo/CompatibleDemo/Compat/Wasaby/CreateControlWithValue/CreateControlWithValue',
   'css!UIDemo/CompatibleDemo/CompatibleDemo'
], function(CompoundControl, template) {
   'use strict';

   var WasabyCreateDemo = CompoundControl.extend({
      _dotTplFn: template,

      init: function() {
         WasabyCreateDemo.superclass.init.call(this);
      },
      destroy: function() {
         WasabyCreateDemo.superclass.destroy.apply(this, arguments);
      }
   });
   return WasabyCreateDemo;
});
