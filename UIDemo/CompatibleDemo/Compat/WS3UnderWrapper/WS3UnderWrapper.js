define('UIDemo/CompatibleDemo/Compat/WS3UnderWrapper/WS3UnderWrapper', [
   'Lib/Control/CompoundControl/CompoundControl',
   'wml!UIDemo/CompatibleDemo/Compat/WS3UnderWrapper/WS3UnderWrapper',
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
   WS3UnderWrapper._styles = ['UIDemo/CompatibleDemo/CompatibleDemo'];

   return WS3UnderWrapper;
});
