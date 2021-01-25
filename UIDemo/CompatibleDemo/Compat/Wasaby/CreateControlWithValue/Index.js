define('UIDemo/CompatibleDemo/Compat/Wasaby/CreateControlWithValue/Index', [
   'UI/Base',
   'wml!UIDemo/CompatibleDemo/Compat/Wasaby/CreateControlWithValue/Index'
], function(UIBase, template) {
   'use strict';

   var ModuleClass = UIBase.Control.extend(
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
