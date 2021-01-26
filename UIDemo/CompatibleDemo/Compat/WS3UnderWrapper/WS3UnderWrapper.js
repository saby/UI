define('UIDemo/CompatibleDemo/Compat/WS3UnderWrapper/WS3UnderWrapper', [
   'Lib/Control/CompoundControl/CompoundControl',
   'wml!UIDemo/CompatibleDemo/Compat/WS3UnderWrapper/WS3UnderWrapper',
   'css!UIDemo/CompatibleDemo/CompatibleDemo'
], function(CompoundControl, template) {
   'use strict';

   var WS3UnderWrapper = CompoundControl.extend({
      _dotTplFn: template,

      init: function() {
         WS3UnderWrapper.superclass.init.call(this);
      },
      destroy: function() {
         WS3UnderWrapper.superclass.destroy.apply(this, arguments);
      }
   });
   return WS3UnderWrapper;
});
