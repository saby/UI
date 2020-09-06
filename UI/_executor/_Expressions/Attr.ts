/// <amd-module name="UI/_executor/_Expressions/Attr" />
/* tslint:disable */
/**
 * @author Тэн В.А.
 */

import { isAttr, checkAttr } from './AttrHelper';
import { _FocusAttrs } from 'UI/Focus';

export { isAttr, checkAttr };

const spacesRE = /\s+/g;
const attrPrefix = 'attr:';
const blackListAttr = [
   'class',
   'style'
];

export interface IAttributes{
   [name: string]: string;
}

function getClass(attr1: IAttributes, attr2: IAttributes): string {
   var attr1Class = attr1.class || attr1['attr:class'];
   var attr2Class = attr2.class || attr2['attr:class'];
   var result = attr1Class ? (attr2Class + ' ' + attr1Class) : attr2Class;
   if (typeof result === 'string') {
      result = result.replace(spacesRE, ' ').trim();
   }
   return result;
}

function getStyle(attr1: IAttributes, attr2: IAttributes): string {
   const style1 = attr1.style || attr1['attr:style'] || '';
   const style2 = attr2.style || attr2['attr:style'] || '';
   let result = '';

   if (style2) {
      result += style2.trim();

      if (style1) {
         // If the styles need to be merged, they should be separated by
         // a semicolon. We have to check if the original string ends
         // with it and add one if it doesn't
         if (result[result.length - 1] !== ';') {
            result += ';';
         }
         result += ' ';
      }
   }
   if (style1) {
      result += style1.trim();
   }
   result = result.replace(spacesRE, ' ');

   return result;
}

/**
 * Мержит атрибут по имени.
 * @param parentAttrs {IAttributes} - родительские атрибуты.
 * @param ownAttrs {IAttributes} - собственные атрибуты.
 * @param name {String}  - имя атрибута, который надо смержит.
 * @param separator {String} - разделить.
 * @returns {String}
 * Пример:
 * mergeAttr({
 *    'style': foo,
 *    'attr:style': bar
 * }, {
 *    'style': foo1,
 *    'attr:style': bar1
 * },
 * 'style',
 * ';'
 * ) => 'bar1; foo1; bar; foo;'
 */
function mergeAttr(parentAttrs: IAttributes, ownAttrs: IAttributes, name: string, separator: string = ''): string {
   const parenAttr = getAttr(parentAttrs, name, separator);
   const ownAttr = getAttr(ownAttrs, name, separator);

   if (parenAttr && ownAttr) {
      return joinAttrs(parenAttr, ownAttr, separator);
   }

   if (ownAttr) {
      return ownAttr.trim();
   }

   if (parenAttr) {
      return parenAttr.trim();
   }

   return '';
}

/**
 * Возвращает значения атрибута. Если одновремно существует атрибут с префиксом 'attr:' и без него, то он их объединит.
 * @param attrs {IAttributes} - атрибуты.
 * @param name {String} - имя требуемого атрибута.
 * @param separator {String} - разделитель для объединения атрибутов.
 */
function getAttr(attrs: IAttributes, name: string, separator: string = ''): string {
   if (attrs) {
      const nameWithPrefix = attrPrefix + name;

      if (attrs.hasOwnProperty(name) && attrs.hasOwnProperty(nameWithPrefix)) {
         return joinAttrs(attrs[name], attrs[nameWithPrefix], separator);
      } else {
         return attrs[name] || attrs[nameWithPrefix];
      }
   }
}

/**
 * Объединяет атрибуты.
 * @param parentAttr {String} - родительские атрибут.
 * @param ownAttr {String} - собственные атрибут.
 * @param name {String} - имя атрибута.
 * @param separator {String} - разделить.
 * @returns {String}
 * Пример:
 * joinAttrs('bar; foo', 'bar1; foo1', ';') => 'bar1; foo1; bar; foo;'
 */
function joinAttrs(parentAttr: string, ownAttr: string, separator: string): string {
   const trimmedParentAttr = parentAttr.trim();
   const trimmedOwnAttr = ownAttr.trim();

   return `${trimmedOwnAttr}${trimmedOwnAttr.endsWith(separator) ? ' ' : separator + ' '}${trimmedParentAttr}`;
}

function addAttribute(attributes: IAttributes, name: string, value?: string): IAttributes {
   if (value) {
      attributes[name] = value;
   }

   return attributes;
}

/**
 * Функция для обхода атрибутов, с исключением.
 * @param attributes {IAttributes} - атрибуты.
 * @param callback {Function} - функция обработчик, вызываемая для каждого атрибута.
 * @return {Boolean} - есть ли атрибуты с префиксом 'attr:'
 */
function forEachAttrs(attributes: IAttributes, callback: Function): boolean {
   if (attributes) {
      let attrHavePrefix = false;
      let key: string;
      let name;
      let value;

      for ([name, value] of Object.entries(attributes)) {
         if (blackListAttr.includes(name) || value === undefined) {
            continue;
         }

         if (name.startsWith(attrPrefix)) {
            if (!attrHavePrefix) {
               attrHavePrefix = true;
            }

            key = name.slice(attrPrefix.length);

            if (blackListAttr.includes(key)) {
              continue;
            }

            callback(value, key, attrPrefix, attrHavePrefix);

            continue;
         }

         callback(value, name, undefined, attrHavePrefix);
      }

      return attrHavePrefix;
   }

   return false;
}

/**
 * Функция мержит собственные атрибуты с родительскими.
 * @param parentAttributes {IAttributes} - родительские атрибуты.
 * @param ownAttributes {IAttributes} - собственные атрибуты.
 * @param cleanPrefix {Boolean} - если true, то отрезаем attr: у всех атрибутов.
 * @returns {IAttributes} - Объект со смерженными атрибутами.
 */
function mergeAttributes(parentAttributes: IAttributes, ownAttributes: IAttributes, cleanPrefix?: boolean): IAttributes {
   const parentAttrWithPrefix: IAttributes = {};
   const parentAttrWithoutPrefix: IAttributes = {};
   const ownAttrsWithoutPrefix: IAttributes = {};
   const ownAttrsWithPrefix: IAttributes = {};

   const parentAttrHavePrefix: boolean = forEachAttrs(parentAttributes, (value, key, prefix, attrHavePrefix) => {
      if (prefix) {
         parentAttrWithPrefix[key] = value;
      } else if (!attrHavePrefix) {
         parentAttrWithoutPrefix[key] = value;
      }
   });

   const parentAttr: IAttributes = parentAttrHavePrefix ? parentAttrWithPrefix : parentAttrWithoutPrefix;
   let currentValue: string;
   let ownKey: string = '';

   const ownAttrHavePrefix: boolean = forEachAttrs(ownAttributes, (value, key, prefix, attrHavePrefix) => {
      if (key === 'key') {
         ownKey = value;
      }

      currentValue = parentAttr.hasOwnProperty(key) ? parentAttr[key] : value;
      delete parentAttr[key];

      if (prefix) {
         if (cleanPrefix) {
            ownAttrsWithPrefix[key] = currentValue;

            return;
         }

         ownAttrsWithPrefix[attrPrefix + key] = currentValue;

         return;
      }

      if (!attrHavePrefix) {
         if (cleanPrefix) {
            ownAttrsWithoutPrefix[key] = currentValue;

            return;
         }

         if (parentAttrHavePrefix) {
            ownAttrsWithoutPrefix[attrPrefix + key] = currentValue;

            return;
         }

         ownAttrsWithoutPrefix[key] = currentValue;
      }
   });

   const attributes = ownAttrHavePrefix ? ownAttrsWithPrefix : ownAttrsWithoutPrefix;
   const prefix = cleanPrefix || !(parentAttrHavePrefix || ownAttrHavePrefix) ? '' : attrPrefix;

   addAttribute(attributes, prefix + 'class', mergeAttr(parentAttributes, ownAttributes, 'class'));

   addAttribute(attributes, prefix + 'style', mergeAttr(parentAttributes, ownAttributes, 'style', ';'));

   addAttribute(attributes, prefix + 'key', ownKey || parentAttr.key);

   if (prefix) {
      forEachAttrs(parentAttr, (value, key) => {
         attributes[attrPrefix + key] = value;
      });

      return attributes;
   }

   forEachAttrs(parentAttr, (value, key) => {
      attributes[key] = value;
   });

   // Значения атрибутов для системы фокусов сбрасываются на дефолтные значения
   if (attributes['ws-creates-context'] === 'default') {
      const value = ownAttributes && ownAttributes[`${ownAttrHavePrefix ? attrPrefix : ''}ws-creates-context`];

      attributes['ws-creates-context'] = value || 'true';
   }

   if (attributes['ws-delegates-tabfocus'] === 'default') {
      const value = ownAttributes && ownAttributes[`${ownAttrHavePrefix ? attrPrefix : ''}ws-delegates-tabfocus`];

      attributes['ws-delegates-tabfocus'] = value || 'true';
   }

   return attributes;
}
export { mergeAttributes as processMergeAttributes }

/**
 * Функция мержит атрибуты
 * @param attr1 - родительские атрибуты
 * @param attr2 - собственные атрибуты
 * @returns объект со смерженными атрибутами
 */
function processFinalAttributes(attr1, attr2) {
   var finalAttr: any = {};
   for (var name in attr1) {
      if (attr1.hasOwnProperty(name)) {
         finalAttr[name] = attr1[name];
      }
   }
   for (var name in attr2) {
      if (attr2.hasOwnProperty(name) && attr2[name] !== undefined) {
         if (name === 'class') {
            finalAttr.class = getClass(finalAttr, attr2);
         } else if (name === 'style') {
            finalAttr.style = getStyle(finalAttr, attr2);
         // We have to rewrite parents keys, so on any depth level we can change attr:key attribute
         } else if (name === 'key') {
            finalAttr[name] = attr2[name];
         } else if (!finalAttr.hasOwnProperty(name)) {
            finalAttr[name] = attr2[name];
         }
      }
   }
   for (name in finalAttr) {
      if (finalAttr.hasOwnProperty(name) && finalAttr[name] === undefined) {
         delete finalAttr[name];
      }
   }
   return finalAttr;
}
export { processFinalAttributes as joinAttrs };

/**
 * Функция обрезает attr: и мержит атрибуты
 * @param attr1 - родительские атрибуты
 * @param attr2 - собственные атрибуты
 * @returns объект со смерженными атрибутами
 */
export function mergeAttrs(attr1, attr2) {
   attr1 = attr1 || {};
   attr2 = attr2 || {};

   var finalAttr: any = {},
      empt,
      name;
   for (name in attr1) {
      if (attr1.hasOwnProperty(name) && attr1[name] !== undefined && attr1[name] !== null) {
         finalAttr[name.replace('attr:', '')] = attr1[name] !== '' ? attr1[name] : undefined;
      }
   }
   for (name in attr2) {
      if (attr2.hasOwnProperty(name) && attr2[name] !== undefined && attr2[name] !== null) {
         if (name === 'attr:class' || name === 'class') {
            finalAttr.class = getClass(finalAttr, attr2);
         } else if (name === 'attr:style' || name === 'style') {
            finalAttr.style = getStyle(finalAttr, attr2);
         // children key value should be always preferable over parent
         } else if (name === 'attr:key' || name === 'key') {
            finalAttr.key = attr2[name];
         } else {
            empt = name.replace('attr:', '');
            if (!finalAttr.hasOwnProperty(empt) || ((empt === 'ws-creates-context' || empt === 'ws-delegates-tabfocus') && finalAttr[empt] === 'default')) {
               finalAttr[empt] = attr2[name] ? attr2[name] : undefined;
            }
         }
      }
   }

   // Значения атрибутов для системы фокусов сбрасываются на дефолтные значения
   _FocusAttrs.resetDefaultValues(finalAttr, attr2);
   return finalAttr;
}

export function mergeEvents(events1, events2) {
   var finalAttr = {}, name;
   for (name in events1) {
      if (events1.hasOwnProperty(name)) {
         finalAttr[name] = events1[name];
      }
   }
   for (name in events2) {
      if (events2.hasOwnProperty(name)) {
         finalAttr[name] = finalAttr[name] ? events2[name].concat(finalAttr[name]) : events2[name];
      }
   }
   return finalAttr;
}
