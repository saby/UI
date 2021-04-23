define('UIDemo/CompatibleDemo/Compat/Wasaby/CoreCreator/Index', [
   'UI/Base',
   'wml!UIDemo/CompatibleDemo/Compat/Wasaby/CoreCreator/Index'
], function(Base, template) {
   'use strict';

   var ModuleClass = Base.Control.extend(
      {
         _template: template,
         _beforeMount: function() {
            try {
               /* TODO: set to presentation service */
               process.domain.req.compatible = true;
            } catch (e) {
            }
         },
      }
   );

   return ModuleClass;
});
