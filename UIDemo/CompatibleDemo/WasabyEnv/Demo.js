define('UIDemo/CompatibleDemo/WasabyEnv/Demo',
   [
      'UI/Base',
      'wml!UIDemo/CompatibleDemo/WasabyEnv/Demo',
      'css!UIDemo/CompatibleDemo/CompatibleDemo'
   ],
   function(UIBase, template) {
      'use strict';

      var CompatibleDemo = UIBase.Control.extend({
         _template: template,
      });
      return CompatibleDemo;
   }
);
