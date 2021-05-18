/// <amd-module name="UICommon/_executor/_Expressions/Attr" />
/* tslint:disable */
/**
 * @author Тэн В.А.
 */

import { isAttr, checkAttr } from './AttrHelper';

export { isAttr, checkAttr };

const EMPTY_STRING = '';
const WHITESPACE = ' ';
const SEMICOLON = ';';
const blackListAttr = [
   'class',
   'style'
];

export interface IAttributes{
   [name: string]: string;
}

function getAttributeValue(name: string, collection: IAttributes): string {
   if (collection[name]) {
      return collection[name];
   }
   return EMPTY_STRING;
}

function concatValues(value1: string, value2: string, separator: string): string {
   if (!value1 || !value2) {
      return value2 || value1;
   }
   if (value2[value2.length - 1] === separator) {
      return value2 + value1;
   }
   return value2 + separator + value1;
}

function getClass(attr1: IAttributes, attr2: IAttributes): string {
   const attr1Class = getAttributeValue('class', attr1);
   const attr2Class = getAttributeValue('class', attr2);
   return concatValues(attr1Class, attr2Class, WHITESPACE);
}

function getStyle(attr1: IAttributes, attr2: IAttributes): string {
   const style1 = getAttributeValue('style', attr1);
   const style2 = getAttributeValue('style', attr2);
   return concatValues(style1, style2, SEMICOLON);
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
      return attrs[name];
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
      let name;
      let value;

      for ([name, value] of Object.entries(attributes)) {
         if (blackListAttr.includes(name) || value === undefined) {
            continue;
         }

         callback(value, name);
      }

      return;
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
function mergeAttributes(parentAttributes: IAttributes, ownAttributes: IAttributes): IAttributes {
   const parentAttr: IAttributes = parentAttributes || {};
   let ownKey: string = '';
   let ownAttrsWithoutPrefix = {};
   let currentValue;

   forEachAttrs(ownAttributes, (value, key) => {
      if (key === 'key') {
         ownKey = value;
      }

      currentValue = parentAttr.hasOwnProperty(key) ? parentAttr[key] : value;
      delete parentAttr[key];
      ownAttrsWithoutPrefix[key] = currentValue;
   });

   const attributes = ownAttrsWithoutPrefix;

   addAttribute(attributes, 'class', mergeAttr(parentAttributes, ownAttributes, 'class'));

   addAttribute(attributes, 'style', mergeAttr(parentAttributes, ownAttributes, 'style', ';'));

   addAttribute(attributes, 'key', ownKey || parentAttr.key);

   forEachAttrs(parentAttr, (value, key) => {
      attributes[key] = value;
   });

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
      name;
   for (name in attr1) {
      if (attr1.hasOwnProperty(name) && attr1[name] !== undefined && attr1[name] !== null) {
         finalAttr[name] = attr1[name] !== '' ? attr1[name] : undefined;
      }
   }
   for (name in attr2) {
      if (attr2.hasOwnProperty(name) && attr2[name] !== undefined && attr2[name] !== null) {
         if (name === 'class') {
            finalAttr.class = getClass(finalAttr, attr2);
         } else if (name === 'style') {
            finalAttr.style = getStyle(finalAttr, attr2);
         // children key value should be always preferable over parent
         } else if (name === 'key') {
            finalAttr.key = attr2[name];
         } else if (name === 'alt') {
            // для тега img следуют всегда оставлять переданный alt
            // чтобы в случае неуспешной загрузки по основному пути вывести значение из alt
            // если просто удалить alt, то получим пустую иконку
            finalAttr.alt = attr2[name];
         }else {
            if (!finalAttr.hasOwnProperty(name)) {
               if (attr2[name]) {
                  finalAttr[name] = attr2[name];
               } else {
                  finalAttr[name] = attr2[name] === 0 ? 0 : undefined;
               }
            }
         }
      }
   }

   return finalAttr;
}

export function mergeEvents(events1, events2, preventMergeEvents = false) {
   var finalAttr = {}, name;
   for (name in events1) {
      if (events1.hasOwnProperty(name)) {
         finalAttr[name] = events1[name];
      }
   }
   for (name in events2) {
      // есть ситуация при которой внутрь partial вставляют контентную опцию, которая содержит этот же partial,
      // а внутри partial логика завязана на эту опцию, при этом в partial есть  шаблон с подпиской на событие через on:
      // в таком случае события смержаться хотя не должны, поэтому следует передать опцию _preventMergeEvents = true
      // такой костыль нужен для того чтобы пробросить item вниз для каждого элемента for
      // https://online.sbis.ru/opendoc.html?guid=80e990de-0813-446e-a372-f00fb7163461
      if (events2.hasOwnProperty(name)){
         finalAttr[name] = (finalAttr[name] && !preventMergeEvents) ? events2[name].concat(finalAttr[name]) : events2[name];
      }
   }
   return finalAttr;
}
