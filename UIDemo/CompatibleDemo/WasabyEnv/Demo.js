define('UIDemo/CompatibleDemo/WasabyEnv/Demo',
   [
      'UI/Base',
      'wml!UIDemo/CompatibleDemo/WasabyEnv/Demo',
   ],
   function(Base, template) {
      'use strict';

      var CompatibleDemo = Base.Control.extend({
         _template: template,
      });
      CompatibleDemo._styles = ['UIDemo/CompatibleDemo/CompatibleDemo'];

      return CompatibleDemo;
   }
);
