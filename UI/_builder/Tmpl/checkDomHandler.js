define('UI/_builder/Tmpl/checkDomHandler', function () {
   'use strict';

   /**
    * @author Крылов М.А.
    * @deprecated Реализован новый html-парсер
    */

   var selfClosingTags = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'],
      disableSelfClosingTags = ['span', 'div', 'td', 'tr', 'p'];

   function DomHandler(callback) {
      if (typeof callback !== "function") {
         callback = null;
      }

      this._callback = callback;
      this.dom = [];
      this._done = false;
      this._tagStack = [];
      this._parser = this._parser || null;
   }

   DomHandler.prototype.getTextAround = function getTextAround(aroundCount) {
      var parser = this._parser;
      var tokenizer = parser._tokenizer;
      var count = aroundCount || 200;
      var index = tokenizer._index,
         start = index - count >= 0 ?
            index - count :
            0,
         end = index + count;

      return tokenizer._buffer.slice(start, end);
   };

   DomHandler.prototype.onparserinit = function onparserinit(parser) {
      this._parser = parser;
   };

   DomHandler.prototype._addDomElement = function _addDomElement(element) {
      var parent = this._tagStack[this._tagStack.length - 1];
      var siblings = parent ? parent.children : this.dom;
      var previousSibling = siblings[siblings.length - 1];

      element.next = null;

      if (previousSibling) {
         element.prev = previousSibling;
         previousSibling.next = element;
      } else {
         element.prev = null;
      }

      siblings.push(element);
      element.parent = parent || null;
   };

   DomHandler.prototype.onopentag = function onopentag(name, attribs, attribsquotes, attribssequence, isSelfClosed) {
      var element = {
         name: name,
         attribs: attribs,
         children: []
      };

      if (isSelfClosed) {
         if (disableSelfClosingTags.indexOf(name) !== -1) {
            this._handleCallback(new Error('Тег "' + name + '" не может быть самозакрывающимся.'));
         }
      } else {
         if (selfClosingTags.indexOf(name) !== -1) {
            this._handleCallback(new Error('Тег "' + name + '" обязан быть самозакрывающимся.'));
         }
      }

      this._addDomElement(element);

      this._tagStack.push(element);
   };

   DomHandler.prototype.onclosetag = function onclosetag(name) {
      if (!this._tagStack.length) {
         this._handleCallback(new Error('Встречен внезапный закрывающий тег "' + name + '", у него нет открывающего тега.'));
      }

      var elem = this._tagStack.pop();

      if (elem.name !== name) {
         this._handleCallback(new Error('Тег "' + name + '" пытается закрыть последний открытый тег "' + elem.name + '", названия этих тегов не совпадают.'));
      }
   };

   DomHandler.prototype._handleCallback = DomHandler.prototype.onerror = function onerror(error) {
      if (error) {
         error.message = 'Проблема в разметке.\n' +
            error.message + '\n' +
            'Поправьте разметку!\n' +
            'Промежуток текста, в котором была найдена ошибка:\n' +
            this.getTextAround();
      }
      if (typeof this._callback === "function") {
         this._callback(error);
      } else {
         if (error) {
            throw error;
         }
      }
   };

   //Resets the handler back to starting state
   DomHandler.prototype.onreset = function onreset() {
      DomHandler.call(this, this._callback);
   };

   //Signals the handler that parsing is done
   DomHandler.prototype.onend = function onend() {
      if (this._done) {
         return;
      }
      this._done = true;
      this._parser = null;
      this._handleCallback(null);
   };

   return DomHandler;
});
