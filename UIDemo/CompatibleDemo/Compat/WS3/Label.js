define('UIDemo/CompatibleDemo/Compat/WS3/Label',
   [
      'Lib/Control/CompoundControl/CompoundControl',
      'tmpl!UIDemo/CompatibleDemo/Compat/WS3/Label'
   ],
   function(Control, template) {
      'use strict';
      var Label = Control.extend([], {
         _dotTplFn: template
      });

      return Label;
   });
