/// <amd-module name="UI/_vdom/Synchronizer/resources/Debug" />
/* tslint:disable */

import {
   getVNodeChidlren,
   isVNodeType,
   isTextNodeType,
   isControlVNodeType,
   isTemplateVNodeType
} from './VdomMarkup';

import { DirtyKind } from './DirtyChecking';
// @ts-ignore
import { TClosure } from 'UI/Executor';
// @ts-ignore
import { ObjectUtils } from 'UI/Utils';
import {_FocusAttrs} from "UI/Focus";

/**
 * @author Кондаков Р.Н.
 */

/* eslint-disable no-console */
const maxDebugLineCount = 20;
const voidElements = {
   area: true,
   base: true,
   br: true,
   col: true,
   embed: true,
   hr: true,
   img: true,
   input: true,
   keygen: true,
   link: true,
   meta: true,
   param: true,
   source: true,
   track: true,
   wbr: true
};
const matchHtmlRegExp = /["'&<>]/;

export function vdomToHTML(vdom, context) {
   function escapeHtml(string) {
      const str = '' + string;
      const match = matchHtmlRegExp.exec(str);

      if (!match) {
         return str;
      }

      let escape;
      let html = '';
      let index;
      let lastIndex = 0;

      for (index = match.index; index < str.length; index++) {
         switch (str.charCodeAt(index)) {
            case 34: // "
               escape = '&quot;';
               break;
            case 38: // &
               escape = '&amp;';
               break;
            case 39: // '
               escape = '&#39;';
               break;
            case 60: // <
               escape = '&lt;';
               break;
            case 62: // >
               escape = '&gt;';
               break;
            default:
               continue;
         }

         if (lastIndex !== index) {
            html += str.substring(lastIndex, index);
         }

         lastIndex = index + 1;
         html += escape;
      }

      return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
   }

   const prefixAttribute = memoizeString(function (name) {
      return escapeHtml(name) + '="';
   });

   function escapeAttributeValue(attrValue) {
      attrValue = attrValue !== undefined && attrValue !== null ? attrValue.toString() : '';
      return attrValue.replace('"', '&quot;');
   }

   /**
    * Create attribute string.
    *
    * @param {String} name The name of the property or attribute
    * @param {*} value The value
    * @param {Boolean} [isAttribute] Denotes whether `name` is an attribute.
    * @return {?String} Attribute string || null if not a valid property or custom attribute.
    */
   function createAttribute(name, value, isAttribute) {
      if (isAttribute) {
         if (value == null) {
            return '';
         }

         return prefixAttribute(name) + escapeAttributeValue(value) + '"';
      }
      // return null if `name` is neither a valid property nor an attribute
      return null;
   }

   /**
    * Memoizes the return value of a function that accepts one string argument.
    *
    * @param {function} callback
    * @return {function}
    */
   function memoizeString(callback) {
      let cache = {};
      return function (string) {
         if (cache.hasOwnProperty(string)) {
            return cache[string];
         } else {
            return (cache[string] = callback.call(this, string));
         }
      };
   }

   function toHTML(node) {
      if (!node) {
         return '';
      }

      if (isControlVNodeType(node)) {
         return new Promise((resolve, reject) => {
            const result = TClosure.createGenerator(false, undefined, {
               prepareAttrsForPartial: function prepareAttrsForPartial(attributes) {
                  return _FocusAttrs.prepareAttrsForFocus(attributes.attributes);
               }
            }).createWsControl(
               node.controlClass,
               node.controlProperties,
               {
                  internal: node.controlInternalProperties, // служебные опции контрола
                  attributes: node.controlAttributes,
                  events: node.controlEvents,
                  key: node.key,
                  context: node.context,
                  inheritOptions: node.inheritOptions
               },
               context
            );
            if (result instanceof Promise) {
               // если строится асинхронный контрол, дождемся результата, он будет храниться в свойстве result
               result.then((resultObj) => {
                  resolve(resultObj.result);
               }, (e) => reject(e));
            } else {
               resolve(result);
            }
         });
      }
      if (isTemplateVNodeType(node)) {
         return TClosure
            .createGenerator(false, undefined, {
               prepareAttrsForPartial: function prepareAttrsForPartial(attributes) {
                  return _FocusAttrs.prepareAttrsForFocus(attributes.attributes);
               }
            })
            .createTemplate(node.template, node.attributes && node.controlProperties, node.attributes, context);
      } else if (isVNodeType(node)) {
         const result = tagContent(node);
         if (result instanceof Promise) {
            return new Promise((resolve, reject) => {
               result.then((result) => {
                  resolve(openTag(node) + result + closeTag(node));
               }, (e) => reject(e));
            });
         } else {
            return openTag(node) + result + closeTag(node);
         }
      } else if (isTextNodeType(node)) {
         return String(node.children);
      } else if (Array.isArray(node) && node.length) {
         return new Promise((resolve, reject) => {
            const promises = [];
            for (let i = 0; i < node.length; i++) {
               const nodeResult = toHTML(node[i]);
               promises.push(Promise.resolve(nodeResult));
            }
            Promise.all(promises).then(values => {
               const result = values.join('');
               resolve(result);
            }, (e) => reject(e));
         });
      } else if (typeof node === 'string') {
         return node;
      }

      return '';
   }

   function openTag(node) {
      const props = node.hprops;
      let ret = '<' + node.type.toLowerCase();
      let value;
      let css;
      let attrProp;
      let styleProp;

      value = props['attributes'];
      for (attrProp in value) {
         if (
            value.hasOwnProperty(attrProp) &&
            value[attrProp] !== null &&
            value[attrProp] !== undefined &&
            value[attrProp] !== ''
         ) {
            ret += ' ' + createAttribute(attrProp, value[attrProp], true);
         }
      }

      /*if (node.hasOwnProperty('key')) {
         ret += ' ' + createAttribute('key', node.key, true);
      }*/

      value = props['style'];
      css = '';
      for (styleProp in value) {
         if (value.hasOwnProperty(styleProp) && value[styleProp] !== null) {
            css += styleProp + ': ' + value[styleProp] + ';';
         }
      }
      if (css !== '') {
         ret += ' ' + createAttribute('style', css, true);
      }

      return ret + '>';
   }

   function tagContent(node) {
      const innerHTML = node.properties && node.properties.innerHTML;
      if (innerHTML) {
         return innerHTML;
      }

      const children = node.children;
      const ln = (children && children.length) || 0;

      return new Promise((resolve, reject) => {
         const promises = [];
         for (let i = 0; i !== ln; i++) {
            const child = children[i];
            const nodeResult = toHTML(child);
            promises.push(Promise.resolve(nodeResult));
         }
         Promise.all(promises).then(values => {
            const result = values.join('');
            resolve(result);
         }, (e) => reject(e));
      });
   }

   function closeTag(node) {
      const tag = node.type.toLowerCase();
      return voidElements[tag] ? '' : '</' + tag + '>';
   }

   const result = toHTML(vdom);
   return Promise.resolve(result);
}

export function logRebuildChanges(changes) {
   function logNodes(title, nodes) {
      if (nodes.length) {
         console.group(title);
         try {
            nodes.forEach(function (node) {
               logControlNode(node);
            });
         } finally {
            console.groupEnd();
         }
      }
   }

   const created = changes.createdNodes.slice(0, maxDebugLineCount);
   const updatedChanged = changes.updatedChangedNodes.slice(0, maxDebugLineCount);
   const updatedUnchanged = changes.updatedUnchangedNodes.slice(0, maxDebugLineCount);
   const destroyed = changes.destroyedNodes.slice(0, maxDebugLineCount);

   console.log('------------------');
   logNodes('Созданы', created);
   logNodes('Обновлены - изменены по опциям', updatedChanged);
   logNodes('Обновлены - не изменены', updatedUnchanged);
   logNodes('Удалены', destroyed);
}

export function logVNode(recursive, vnode) {
   let titleArr;
   let arr = [];

   if (isControlVNodeType(vnode)) {
      logControlNode(vnode.controlNode);
   } else {
      titleArr = [isVNodeType(vnode) ? vnode.tagName : isTextNodeType(vnode) ? vnode.text : '???'];
      if (vnode.key !== undefined) {
         titleArr.push[vnode.key];
      }

      arr = [titleArr.join('/')];
      if (isVNodeType(vnode)) {
         arr.push(ObjectUtils.isEmpty(vnode.properties) ? '' : vnode.properties);
      }

      if (recursive) {
         console.group.apply(console, arr);
         try {
            getVNodeChidlren(vnode).forEach(logVNode.bind(undefined, recursive));
         } finally {
            console.groupEnd();
         }
      } else {
         console.log.apply(console, arr);
      }
   }
}

export function logControlNode(node) {
   const control = node.control;
   const name = control.get('name');
   const id = node.id;
   const dirty = node.environment._currentDirty[id] || DirtyKind.NONE;
   const dirtyStr = dirty === DirtyKind.NONE ? [] : dirty === DirtyKind.DIRTY ? ['D'] : ['C'];
   let arr;

   arr = (name ? [name] : []).concat([control.describe()]);
   if (node.key !== undefined) {
      arr.push(node.key);
   }

   arr = arr.concat(dirtyStr);

   console.log(arr.join('/'), node.id, control.getRawData());
}
