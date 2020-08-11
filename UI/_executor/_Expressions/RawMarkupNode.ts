/// <amd-module name="UI/_executor/_Expressions/RawMarkupNode" />
/* tslint:disable */

import { _FocusAttrs } from 'UI/Focus';

// this class need for create instance containing raw html and some properties.
// VDOM will insert it as is and generated node will get some properties.
export default class RawMarkupNode {
   public markup;
   public dom;
   public key;
   public nodeProperties;
   public moduleName: string = 'UI/_executor/_Expressions/RawMarkupNode';

   constructor(markup, attributes, moduleName, key) {
      var nodeProperties = {};
      if (attributes.hasOwnProperty('attr:ws-creates-context')) {
         nodeProperties['ws-creates-context'] = attributes['attr:ws-creates-context'];
      }
      if (attributes.hasOwnProperty('attr:ws-delegates-tabfocus')) {
         nodeProperties['ws-delegates-tabfocus'] = attributes['attr:ws-delegates-tabfocus'];
      }
      if (attributes.hasOwnProperty('attr:ws-tab-cycling')) {
         nodeProperties['ws-tab-cycling'] = attributes['attr:ws-tab-cycling'];
      }
      if (attributes.hasOwnProperty('attr:ws-no-focus')) {
         nodeProperties['ws-no-focus'] = attributes['attr:ws-no-focus'];
      }
      // todo в resetDefaultValues нужно передать вторым аргументом атрибуты, которые могут перебить дефолтные
      _FocusAttrs.resetDefaultValues(nodeProperties);

      this.markup = markup;
      this.dom = null;
      this.key = key;
      this.nodeProperties = nodeProperties;
      //this.type = {name: moduleName.replace(/\//ig,'.')};
   }

   public applyMarkup(elem) {
      elem.innerHTML = this._getMarkup();

      //newElem will be appended to DOM, so we should always return valid DOMNode (can be TextDOMNode)
      var newElem = elem.firstChild || document.createTextNode('');
      this._setProperties(newElem);
      return newElem;
   }

   private _getMarkup() {
      if (typeof this.markup !== 'string') {
         return '';
      }
      return this.markup.trim();
   }

   private _setProperties(elem) {
      Object.keys(this.nodeProperties).forEach(function (name) {
         elem[name] = this.nodeProperties[name];
      }.bind(this));
   }
}
