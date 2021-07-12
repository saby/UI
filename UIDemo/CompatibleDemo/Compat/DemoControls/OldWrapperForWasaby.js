define('UIDemo/CompatibleDemo/Compat/DemoControls/OldWrapperForWasaby', [
   'Lib/Control/CompoundControl/CompoundControl',
   'wml!UIDemo/CompatibleDemo/Compat/DemoControls/OldWrapperForWasaby',
   'UI/Base',
   'Vdom/Vdom',
   'Controls/input'
], function(CompoundControl, template, Base, Vdom, input) {

   var CompatibleDemoNext = CompoundControl.extend({
      _dotTplFn: template,
      _text: null,

      init: function() {
         CompatibleDemoNext.superclass.init.call(this);
         this.myTextBoxElement = this._container.find('.for__ws4');
         this.myTextBox = Base.Control.createControl(
             input.Text,
            {
               name: 'myTextBox',
               value: this._text,
            },
            this.myTextBoxElement
         );
      },

      destroy: function() {
         if (this.myTextBox) {
            Vdom.Synchronizer.unMountControlFromDOM(
               this.myTextBox,
               this.myTextBoxElement
            );
            this.myTextBox = null;
            this.myTextBoxElement = null;
         }
         CompatibleDemoNext.superclass.destroy.apply(this, arguments);
      }
   });

   return CompatibleDemoNext;
});
