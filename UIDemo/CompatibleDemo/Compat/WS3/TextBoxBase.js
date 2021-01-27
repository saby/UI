define('UIDemo/CompatibleDemo/Compat/WS3/TextBoxBase',
   [
      'Env/Env',
      'Lib/Control/CompoundControl/CompoundControl',
      'Lib/Mixins/CompoundActiveFixMixin'
   ], function(Env, CompoundControl, CompoundActiveFixMixin) {
      'use strict';
      var TextBoxBase = CompoundControl.extend([CompoundActiveFixMixin], {

         $protected: {
            _keysWeHandle: [
               Env.constants.key.del,
               Env.constants.key.backspace,
               Env.constants.key.left,
               Env.constants.key.right,
               Env.constants.key.minus,
               Env.constants.key.space,
               Env.constants.key.m,
               Env.constants.key.o
            ],
            /* Флаг, по которому смотрим, надо ли запускать валидацию по уходу фокуса,
               выставляется он методе setText. Если опция забиндена на контекст, то компонент должен создаваться уже проставленой опцией,
               поэтому в методе setText опция должна меняться. */
            _textChanged: false,
            _options: {
               _isMultiline: false,
               _paddingClass: ' controls-Text-InputRender_paddingBoth controls-TextBox_paddingBoth',
               text: '',
               trim: false,
               maxLength: null,
               focusOnActivatedOnMobiles: false,
               textAlign: 'left',
               style: 'default',
               inputType: 'Text',
               size: 'default',
               autocomplete: true
            }
         },

         $constructor: function() {
            this._publish('onTextChange');

            this._options.text = (this._options.text) ? this._options.text.toString() : '';
         },
         setText: function(text){
            var newTextIsEmpty = this._isEmptyValue(text),
               newText = newTextIsEmpty ? text : this._formatText(text.toString());

            //На андроиде не стреляет событие keyPress, а в нем делался preventDefault для значений, которые не подходят под inputRegExp
            //Чтобы убирать эти значения из поля ввода нужно всегда перерисовывать текст
            if (newText !== this._options.text || Env.detection.isMobileAndroid) {
               if(!this._textChanged && !(newTextIsEmpty && this._isEmptyValue(this._options.text))) {
                  this._textChanged = true;
               }
               this._options.text = newText;
               this._drawText(newText);
               //снимаем выделение валидатора на время ввода
               this.clearMark();
               this._notify('onTextChange', newText);
               this._notifyOnPropertyChanged('text');
            }
         },

         //Проверка на пустое значение, их нужно хранить в неизменном виде, но отображать как пустую строку
         _isEmptyValue: function(text){
            return text === null || text === "" || typeof text === "undefined";
         },
         getText:function(){
            return this._options.text;
         },
         setMaxLength: function(num) {
            this._options.maxLength = num;
         },

         isChanged: function() {
            return this._textChanged
         },

         _formatText : function(text) {
            return text || ''; // так как есть датабиндинг может прийти undefined
         },

         _onClickHandler: function(event){
            var elementToFocus = this._getElementToFocus();
            // т.к. поле ввода находится внутри контейнера, то клик по внешнему контейнеру не ставит курсор в поле
            // поэтому принудительно проставляем фокус в активное поле
            // если фокус уже на поле ввода, то повторно проставлять не нужно
            if (this.isEnabled() && elementToFocus[0] !== document.activeElement && this._shouldFocus(event.target)) {
               elementToFocus.focus();
            }
            TextBoxBase.superclass._onClickHandler.call(this, event);
         },

         _shouldFocus: function(target) {
            var container = this.getContainer()[0];
            return target === container || target === $('.controls-InputRender__wrapper', container)[0] || target === $('.controls-InputRender__fieldWrapper', container)[0];
         },

         _getElementToFocus: function() {
            return this._inputField || TextBoxBase.superclass._getElementToFocus.apply(this, arguments);
         },

         _drawText: function() {

         },

         _keyboardHover: function(event){
            event.stopPropagation();
            return true;
         },

         getValue : function() {
            Env.IoC.resolve('ILogger').log('getValue()', 'getValue is deprecated. Use getText()');
            return this.getText();
         },

         setValue : function(txt) {
            Env.IoC.resolve('ILogger').log('setValue()', 'setValue is deprecated. Use setText()');
            this.setText(txt);
         },
         _setEnabled: function(enabled) {
            TextBoxBase.superclass._setEnabled.apply(this, arguments);
            this._toggleState();
         },
         clearMark: function() {
            TextBoxBase.superclass.clearMark.apply(this, arguments);
            this._toggleState();
         },
         markControl: function() {
            TextBoxBase.superclass.markControl.apply(this, arguments);
            this._toggleState();
         },
         _updateActiveStyles: function() {
            TextBoxBase.superclass._updateActiveStyles.apply(this, arguments);
            this._toggleState();
         },
         _getStateToggleContainer: function(){
            return this._container;
         },
         _toggleState: function() {
            var container = this._getStateToggleContainer()[0];
            container.className = container.className.replace(/(^|\s)controls-TextBox_state_\S+/gi, '');
            container.className = container.className.replace(new RegExp('(^|\\\s)controls-' + this._options.inputType + '-InputRender_state_\\\S+', 'gi'), '');
            this._getStateToggleContainer().addClass(this._getToggleState());
         },
         _getToggleState: function() {
            var
               active = this.isActive(),
               enabled = this.isEnabled(),
               marked = this.isMarked();
            return 'controls-TextBox_state_' +
               (marked ? 'error' : !enabled ? 'disabled' +
                  (this._options._isMultiline ? ' controls-TextBox_state_disabled_multiLine' : ' controls-TextBox_state_disabled_singleLine') : active ? 'active' : 'default') +
               ' controls-' + this._options.inputType + '-InputRender_state_' +
               (marked ? 'error' : !enabled ? 'disabled' +
                  (this._options._isMultiline ? ' controls-' + this._options.inputType + '-InputRender_state_disabled_multiLine' : ' controls-' + this._options.inputType + '-InputRender_state_disabled_singleLine') : active ? 'active' : 'default');
         }
      });


      TextBoxBase.runDefaultAction = function(event, e) {
         var
            control = event.getTarget(),
            res, parent;
         if (e.which === Env.constants.key.enter) {
            if (!(e.altKey || e.shiftKey || e.ctrlKey || e.metaKey)) {
               parent = control;

               while(parent) {

                  while (parent && !parent._defaultAction) {
                     parent = parent.getParent();
                  }
                  if (!parent) {
                     break;
                  }

                  if (parent._defaultAction) {
                     res = parent._defaultAction(e);
                  }
                  if (res) {
                     parent = parent.getParent();
                  } else {
                     break;
                  }
               }
            }
         }
      };

      return TextBoxBase;

   });
