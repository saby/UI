define('UIDemo/CompatibleDemo/Compat/WS3/TextBox', [
   'Env/Event',
   'Env/Env',
   'UIDemo/CompatibleDemo/Compat/WS3/TextBoxBase',
   'tmpl!UIDemo/CompatibleDemo/Compat/WS3/TextBox',
   'tmpl!UIDemo/CompatibleDemo/Compat/WS3/textFieldWrapper',
   'Core/helpers/Function/forAliveOnly'
], function(
   EnvEvent,
   Env,
   TextBoxBase,
   dotTplFn,
   textFieldWrapper,
   forAliveOnly
) {
   'use strict';

   var _private = {
      prepareInformationIconColor: function(color) {
         var resColor = color;

         // поддержка старых цветов, чтоб не ломать старые контроы
         if (color === 'attention') {
            resColor = 'warning';
         }
         if (color === 'done') {
            resColor = 'success';
         }
         if (color === 'error') {
            resColor = 'danger';
         }
         if (color === 'primary') {
            resColor = 'secondary';
         }
         return resColor;
      }
   };
   var TextBox = TextBoxBase.extend({
      _dotTplFn: dotTplFn,

      $protected: {
         _fromTouch: false,
         _pasteProcessing: 0,
         _inputField: null,

         // Сделаем значение по умолчанию undefined, т.к. это отсутствие значение, а null может прилететь из контекста.
         _tooltipText: undefined,
         _textFieldWrapper: null,
         _informationIcon: null,
         _options: {
            textFieldWrapper: textFieldWrapper,

            textTransform: 'none',

            selectOnClick: false,

            inputRegExp: '',

            informationIconColor: '',

            autocomplete: false
         }
      },

      $constructor: function() {
         this._publish('onPaste', 'onInformationIconMouseEnter', 'onInformationIconActivated');
         var self = this;
         this._inputField = this._getInputField();

         this._inputField
            .on('drop', function(event) {
               self._isDropped = true;

               window.setTimeout(function() {
                  self._pasteHandler(event);
               }, 100);
            })
            .on('change', function() {
               var newText = self._getInputValue(),
                  inputRegExp = self._options.inputRegExp;

               if (newText != self._options.text) {
                  if (inputRegExp) {
                     newText = self._checkRegExp(newText, inputRegExp);
                  }
                  self.setText(newText);
               }
            })
            .on('mousedown', this._inputMousedownHandler.bind(this))
            .on('click', this._inputClickHandler.bind(this))
            .on('focusin', this._inputFocusInHandler.bind(this));

         this._applyTooltip = this._applyTooltip.bind(this);
         this._keyboardDispatcher = this._keyboardDispatcher.bind(this);
         this._container
            .on('keypress keydown keyup', this._keyboardDispatcher)
            .on('keyup mouseenter', this._applyTooltip)
            .on('touchstart', function() {
               self._fromTouch = true;
            });
      },

      _modifyOptions: function() {
         var cfg = TextBox.superclass._modifyOptions.apply(this, arguments);
         cfg._informationIconColor = _private.prepareInformationIconColor(cfg.informationIconColor);

         /**
          * На поле с отключенным автодопонением не должно быть атрибута name,
          * для того чтобы браузер не применял к нему автодопонение адресов, банковских карт и т.д.
          */
         cfg._fieldName = cfg.autocomplete ? cfg.name || '' : '';

         return cfg;
      },

      _checkRegExp: function(text, regExp) {
         var newText = '',
            inputRegExp = new RegExp(regExp);
         for (var i = 0; i < text.length; i++) {
            if (inputRegExp.test(text[i])) {
               newText = newText + text[i];
            }
         }
         return newText;
      },

      init: function() {
         var self = this;
         TextBox.superclass.init.apply(this, arguments);

         if (this._options.informationIconColor) {
            this._informationIcon = $('.controls-TextBox__informationIcon', this.getContainer());
         }

         if (this._options.maxLength) {
            this.setMaxLength(this._options.maxLength);
         }

         this._container.on('mouseenter', '.controls-TextBox__informationIcon', function(e) {
            self._notify('onInformationIconMouseEnter');
         });
         this._container.on('click', function(e) {
            if ($(e.target).hasClass('controls-TextBox__informationIcon')) {
               self._notify('onInformationIconActivated');
            }
         });

         /* Надо проверить значение input'a, т.к. при дублировании вкладки там уже может быть что-то написано */
         this._checkInputVal(true);
      },

      /**
       * Устанавливает цвет информационной иконки.
       * Цвета доступные для установки:
       * <ol>
       *    <li>done</li>
       *    <li>attention</li>
       *    <li>disabled</li>
       *    <li>error</li>
       *    <li>primary</li>
       * </ol>
       * @see informationIcon
       * @see informationIconColor
       */
      setInformationIconColor: function(color) {
         if (!color) {
            this._options.informationIconColor = color;
            this._options._informationIconColor = _private.prepareInformationIconColor(this._options.informationIconColor);
            this._destroyInformationIcon();
            return;
         }

         if (!this._informationIcon) {
            this._createInformationIcon(this._options._informationIconColor);
         }

         this._informationIcon.removeClass('controls-TextBox__informationIcon-' + this._options._informationIconColor);
         this._informationIcon.removeClass('controls-InputRender__tagStyle-' + this._options._informationIconColor);
         this._options.informationIconColor = color;
         this._options._informationIconColor = _private.prepareInformationIconColor(this._options.informationIconColor);
         this._informationIcon.addClass('controls-TextBox__informationIcon-' + this._options._informationIconColor);
         this._informationIcon.addClass('controls-InputRender__tagStyle-' + this._options._informationIconColor);
      },

      _createInformationIcon: function(color) {
         this._informationIcon = $('<div class="controls-InputRender__tagStyle controls-TextBox__informationIcon controls-TextBox__informationIcon-' + color + ' controls-InputRender__tagStyle-' + color + '"></div>');
         this.getContainer().append(this._informationIcon);
      },

      _destroyInformationIcon: function() {
         if (this._informationIcon) {
            this._informationIcon.remove();
            this._informationIcon = undefined;
         }
      },

      _keyboardDispatcher: function(event) {
         return forAliveOnly(function(event) {
            var result = true;
            switch (event.type) {
               case 'keydown':
                  result = this._keyDownBind.call(this, event);
                  break;
               case 'keyup':
                  result = this._keyUpBind.call(this, event);
                  break;
               case 'keypress':
                  result = this._keyPressBind.call(this, event);
                  break;
            }
            return result;
         }).call(this, event);
      },

      _checkInputVal: function(fromInit) {
         var text = this._getInputValue();

         // При ините не должен вызываться trim, поэтому будем проверять по этому флагу попали в checkInputVal из init или нет
         if (this._options.trim && !fromInit && this.isEnabled()) {
            text = text.trim();
         }

         // Установим текст только если значения различны и оба не пустые
         if (this._isTextChanged(text, this._options.text)) {
            this.setText(text);
         }
      },

      _isTextChanged: function(oldText, newText) {
         return oldText !== newText && !(this._isEmptyValue(newText) && !(oldText || '').length);
      },

      /**
       * Применить tooltip
       * Если текст не умещается в поле по ширине, то показываем подсказку с полным текстом
       * Если текст умещается, то показываем из опции tooltip
       */
      _applyTooltip: function() {
         /**
          * Если уничтожение контрола инициировали по событиям применения tooltip, то обработчик
          * будет выполняться с уничтоженным контролом. В этом случае делать ничего не нужно.
          */
         if (this.isDestroyed()) {
            return;
         }
         var field = this._getFieldForTooltip();
         if (this._tooltipText !== this._options.text) {
            var scrollWidth;
            scrollWidth = field[0].scrollWidth;

            // для случая, когда текст не умещается в поле ввода по ширине, показываем всплывающую подсказку с полным текстом
            if (scrollWidth > field[0].clientWidth) {
               this._container.attr('title', this._options.text);
               if (Env.detection.isIE) {
                  field.attr('title', this._options.text);
               }
            } else if (this._options.tooltip) {
               this.setTooltip(this._options.tooltip);
            } else {
               this._container.attr('title', '');

               // Для работы плейсхолдеров в IE на поля ввода навешивается аттрибут required.
               // При наведении курсора на такие поля, браузеры показывают всплывающую подсказку "Это обязательное поле."
               // Чтобы её скрыть в IE нужно в аттрибут title поставить пустую строку.
               if (Env.detection.isIE) {
                  field.attr('title', '');
               }
            }
            this._tooltipText = this._options.text;
         }
      },

      _getFieldForTooltip: function() {
         return this._inputField;
      },

      /**
       * Устанавливает режим выделения текста в поле ввода при получении фокуса.
       * @param {Boolean} flag
       */
      setSelectOnClick: function(flag) {
         this._options.selectOnClick = flag;
      },

      setTooltip: function(tooltip) {
         this._getFieldForTooltip().attr('title', tooltip);
         TextBox.superclass.setTooltip.apply(this, arguments);
      },

      _drawText: function(text) {
         if (this._getInputValue() != text) {
            this._setInputValue(text || '');
         }
      },

      setMaxLength: function(num) {
         TextBox.superclass.setMaxLength.call(this, num);

         // IE - единственный браузер, который навешивает :invalid, если через js поставить текст, превышаюший maxLength
         // Т.к. мы показываем плейсхолдер, если на поле ввода висит :invalid, то он не скрывается.
         // Поэтому для IE просто не будем навешивать аттрибут maxLength
         this._fixMaxLengthIE = Env.detection.isIE && !Env.detection.isIE12;
         this._inputField.attr('maxlength', this._fixMaxLengthIE ? null : num);
      },

      /**
       * Устанавливает форматирование регистра текста в поле ввода.
       * @param {String} textTransform Необходимое форматирование регистра текста.
       * @variant uppercase Все символы текста становятся прописными (верхний регистр).
       * @variant lowercase Все символы текста становятся строчными (нижний регистр).
       * @variant none Текст не меняется.
       * @example
       * <pre>
       *    control.setTextTransform("lowercase");
       * </pre>
       * @see textTransform
       */
      setTextTransform: function(textTransform) {
         switch (textTransform) {
            case 'uppercase':
               this._inputField.removeClass('controls-TextBox__field-lowercase')
                  .addClass('controls-TextBox__field-uppercase');
               break;
            case 'lowercase':
               this._inputField.removeClass('controls-TextBox__field-uppercase')
                  .addClass('controls-TextBox__field-lowercase');
               break;
            default:
               this._inputField.removeClass('controls-TextBox__field-uppercase')
                  .removeClass('controls-TextBox__field-lowercase');
         }
      },

      _keyDownBind: function(event) {
         if (event.which == 13) {
            this._checkInputVal();
         }
      },

      _keyUpBind: function(event) {
         var newText = this._getInputValue(),
            textsEmpty = this._isEmptyValue(this._options.text) && this._isEmptyValue(newText);
         if (this._options.text !== newText && !textsEmpty) {
            if (this._options.inputRegExp) {
               newText = this._checkRegExp(newText, this._options.inputRegExp);
            }
            this._setTextByKeyboard(newText);
         }
         var key = event.which || event.keyCode;
         if ([Env.constants.key.up, Env.constants.key.down].indexOf(key) >= 0) {
            event.stopPropagation();
         }
      },

      _setTextByKeyboard: function(newText) {
         this.setText(newText);
      },

      _formatText: function(text) {
         var formattedText = TextBox.superclass._formatText.call(this, text);

         /**
          * В IE мы не можем использовать нативное свойство maxlength. Поэтому эмулируем его сами.
          */
         if (this._fixMaxLengthIE && this._options.maxLength) {
            var field = this._inputField[0];
            var needlessChars = Math.max(0, text.length - this._options.maxLength);
            var carriagePosition = field.selectionEnd;

            formattedText =
               formattedText.substring(0, carriagePosition - needlessChars) +
               formattedText.substring(carriagePosition);
            carriagePosition -= needlessChars;

            this._drawText(formattedText);
            if (document.activeElement === field) {
               field.setSelectionRange(carriagePosition, carriagePosition);
            }
         }

         return formattedText;
      },

      _getInputValue: function() {
         return this._inputField && this._inputField.val();
      },
      _setInputValue: function(value) {
         this._inputField && this._inputField.val(value);
      },
      _getInputField: function() {
         return $('.js-controls-TextBox__field', this.getContainer().get(0));
      },

      _keyPressBind: function(event) {
         if (this._options.inputRegExp && !event.ctrlKey) {
            return this._inputRegExp(event, new RegExp(this._options.inputRegExp));
         }
      },

      _getElementToFocus: function() {
         return this._inputField;
      },

      _setEnabled: function(enabled) {
         TextBox.superclass._setEnabled.call(this, enabled);

         // FIXME Шаблонизатор сейчас не позволяет навешивать одиночные атрибуты, у Зуева Димы в планах на сентябрь
         // сделать возможность вешать через префикс attr-
         this._inputField.prop('readonly', !enabled);
      },
      _inputRegExp: function(e, regexp) {
         var keyCode = e.which || e.keyCode;

         // Клавиши стрелок, delete, backspace и тд
         if (!e.charCode) {
            return true;
         }
         if (keyCode < 32 || e.ctrlKey || e.altKey) {
            return false;
         }
         if (!regexp.test(String.fromCharCode(keyCode))) {
            return false;
         }
         return true;
      },

      _pasteHandler: function(event, noTrimText) {
         var text = this._getInputValue(),
            inputRegExp = this._options.inputRegExp;
         if (inputRegExp) {
            text = this._checkRegExp(text, inputRegExp);
         }
         if (this._options.trim && noTrimText !== true) {
            text = text.trim();
         }
         text = this._formatText(text);
         this._drawText(text);

         /* Событие paste может срабатывать:
           1) При нажатии горячих клавиш
           2) При вставке из котекстного меню.

           Если текст вставлют через контекстное меню, то нет никакой возможности отловить это,
           но событие paste гарантированно срабатывает после действий пользователя. Поэтому мы
           можем предполагать, что это ввод с клавиатуры, чтобы правильно работали методы,
           которые на это рассчитывают.
           */
         this._setTextByKeyboard(text);
      },

      _inputMousedownHandler: function() {
         this._clicked = true;
      },

      _moveCursorAfterActivation: function() {
         this._inputField[0].setSelectionRange(this._inputField.val().length, this._inputField.val().length);
         this._inputField[0].scrollTop = 99999;
         this._inputField[0].scrollLeft = 99999;
      },

      _inputClickHandler: function(e) {

      },

      _inputFocusInHandler: function(e) {
         var self = this;

         /**
          * Если браузер вставит в поле значение(auto-fill), то иногда может не появляться курсор при клике в поле.
          * В чем причина не понятно. Поле начинает нормально работать, если обновить ему value. Обновляем на текущее.
          * Делать это нужно ассинхронно, потому что value может быть пустым, пока пользователь не провзаимодействует со страницей.
          * https://bugs.chromium.org/p/chromium/issues/detail?id=669724#c6
          */
         if (this._options._updateValueOnFocus && Env.detection.chrome) {
            setTimeout(function() {
               var field = self._getInputField()[0];

               var start = field.selectionStart;
               var end = field.selectionEnd;

               field.value = field.value;

               /**
                * После смены value курсор уходит в конец, поэтому восстанавливаем его.
                */
               field.selectionStart = start;
               field.selectionEnd = end;


               self._options._updateValueOnFocus = false;
            }, 0);
         }

         if (this._fromTouch) {
            EnvEvent.Bus.globalChannel().notify('MobileInputFocus');
         }
         if (this._options.selectOnClick) {
            // IE теряет выделение, если select вызывается из обработчика focusin, так что обернём в setTimeout.
            // https://codepen.io/anon/pen/LBYLpJ
            if (Env.detection.isIE) {
               setTimeout(function() {
                  if (self.isActive()) {
                     self._selectText();
                  }
               }, 0);
            } else {
               self._selectText();
            }
         } else if (this.isEnabled() && !this._clicked) {
            /**
             * Нельзя перемещать курсор, если фокус перешел по средствам перетаскивания значения в поле.
             */
            if (this._isDropped) {
               this._isDropped = false;
            } else {
               this._moveCursorAfterActivation();
            }
         }

         /* При получении фокуса полем ввода, сделаем контрол активным.
          *  Делать контрол надо активным по фокусу, т.к. при клике и уведении мыши,
          *  кусор поставится в поле ввода, но соыбтие click не произойдёт и контрол актвным не станет, а должен бы. */
         if (!this.isActive()) {
            this.setActive(true, false, true);
            e.stopPropagation();
         }

         // убираем курсор на ipad'e при нажатии на readonly поле ввода
         if (!this.isEnabled() && Env.detection.isMobilePlatform) {
            this._inputField.blur();
         }
      },

      destroy: function() {
         this._inputField.off('*');
         this._inputField = undefined;
         this._destroyInformationIcon();
         this._container
            .off('keypress keydown keyup', this._keyboardDispatcher)
            .off('keyup mouseenter', this._applyTooltip);
         TextBox.superclass.destroy.apply(this, arguments);
      },

      _selectText: function() {
         var
            selection,
            range;

         if (this._inputField[0].select) {
            this._inputField[0].select();
         } else {
            selection = window.getSelection();
            range = document.createRange();
            range.selectNodeContents(this._inputField[0]);
            selection.removeAllRanges();
            selection.addRange(range);
         }
      }
   });

   return TextBox;
});
