/// <amd-module name="UICommon/_executor/_Markup/Helper" />
import * as Attr from '../_Expressions/Attr';
import { processMergeAttributes } from '../_Expressions/Attr';

export { uniteScope } from '../_Expressions/Scope';
export { processMergeAttributes };

export function plainMergeAttr(inner, object) {
   if (!inner) {
      inner = {};
   }
   if (!object) {
      object = {};
   }

   /*
    * Атрибуты из шаблона не нужны в VDom контролах
    * */
   if (object.attributes && Object.keys(object.attributes).length === 2 && object.attributes['name'] === object.attributes['sbisname']
      && object.attributes['sbisname'] !== undefined) {
      object = {};
   }

   var controlKey;
   if (object.attributes && object.attributes['key']) {
      controlKey = object.attributes['key'];
   }
   controlKey = controlKey || object.key || inner.key;

   return {
      inheritOptions: object.inheritOptions,
      context: inner.context,
      internal: inner.internal,
      systemOptions: {},
      domNodeProps: {},
      key: controlKey,
      attributes: Attr.processMergeAttributes(inner.attributes, object.attributes),
      events: Attr.mergeEvents(inner.events, object.events)
   };
}

export function plainMergeContext(inner, object) {
   if (!inner) {
      inner = {};
   }
   if (!object) {
      object = {};
   }
   var controlKey;
   if (object.attributes && object.attributes['key']) {
      controlKey = object.attributes['key'];
   }
   controlKey = controlKey || object.key || inner.key;

   return {
      attributes: object.attributes || {},
      events: object.events || {},
      inheritOptions: inner.inheritOptions,
      internal: inner.internal,
      context: inner.context,
      key: controlKey
   };
}

export const config = {
   moduleMaxNameLength: 4096
};
