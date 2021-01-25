define('UIDemo/CompatibleDemo/WasabyEnv/WS3/WS3',
   [
      'UI/Base',
      'wml!UIDemo/CompatibleDemo/WasabyEnv/WS3/WS3',
      'Lib/Control/LayerCompatible/LayerCompatible',
      'css!UIDemo/CompatibleDemo/CompatibleDemo'
   ],
   function(UIBase, template, CompatibleLayer) {
      'use strict';

      var WS3Compatible = UIBase.Control.extend({
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
      return WS3Compatible;
   }
);
