define('UIDemo/CompatibleDemo/WasabyEnv/DemoControls/WasabyContainer',
   [
      'UI/Base',
      'wml!UIDemo/CompatibleDemo/WasabyEnv/DemoControls/WasabyContainer',
      'Lib/Control/LayerCompatible/LayerCompatible',
      'css!UIDemo/CompatibleDemo/CompatibleDemo'
   ],
   function(UIBase, template, CompatibleLayer) {
      'use strict';

      var WasabyContainer = UIBase.Control.extend({
         _template: template,
         _compatibleReady: false,
         _text: null,

         _beforeMount: function() {
            this._text = 'Wait...';
         },

         _afterMount: function() {
            var self = this;
            CompatibleLayer.load()
               .addCallback(function() {
                  self._compatibleReady = true;
                  self._text = 'Init success!';
                  self._forceUpdate();
               });
         },
         _setText: function(e, value) {
            this._text = value;
         },

         _setTextOld: function(e, value) {
            this.getTopParent()._logicParent._setText(e, value);
         },
      });
      return WasabyContainer;
   }
);
