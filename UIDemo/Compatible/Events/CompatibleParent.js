define('UIDemo/Compatible/Events/CompatibleParent', [
      'Lib/Control/CompoundControl/CompoundControl',
      'wml!UIDemo/Compatible/Events/CompatibleParent',
      'UI/Base',
      'UIDemo/Compatible/Events/WasabyContainer',
      'Core/helpers/Hcontrol/makeInstanceCompatible'
   ],

   function(CompoundControl, dotTplFn, UIBase, WasabyContainer, makeInstanceCompatible) {
      var moduleClass = CompoundControl.extend({
         _dotTplFn: dotTplFn,

         init: function() {
            var self = this;
            moduleClass.superclass.init.call(self);
            var wasaby = UIBase.Control.createControl(WasabyContainer, {}, document.getElementsByClassName('wasaby')[0]);
            makeInstanceCompatible(wasaby);
            this.subscribeTo(wasaby, 'myEvent', function() {
               wasaby.value = 'true';
            });
         }
      });
      return moduleClass;
   }
);
