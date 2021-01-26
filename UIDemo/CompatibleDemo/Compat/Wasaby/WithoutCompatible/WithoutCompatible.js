define('UIDemo/CompatibleDemo/Compat/Wasaby/WithoutCompatible/WithoutCompatible',
   [
      'Lib/Control/CompoundControl/CompoundControl',
      'wml!UIDemo/CompatibleDemo/Compat/Wasaby/WithoutCompatible/WithoutCompatible',
      'css!UIDemo/CompatibleDemo/CompatibleDemo'
   ],
   function(CompoundControl, template) {
      'use strict';

      var WasabyWithoutCompatible = CompoundControl.extend({
         _dotTplFn: template,

         init: function() {
            WasabyWithoutCompatible.superclass.init.call(this);
         },
         destroy: function() {
            WasabyWithoutCompatible.superclass.destroy.apply(this, arguments);
         }

      });
      return WasabyWithoutCompatible;
   }
);
