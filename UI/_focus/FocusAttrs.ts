/// <amd-module name="UI/_focus/FocusAttrs   " />
/* tslint:disable */

import { checkAttr } from './AttrHelper';

export function prepareAttrsForFocus(attributes, opts) {
   if (!attributes) {
      return;
   }

   if (checkAttr(attributes)) {
      if (!attributes['attr:ws-creates-context']) {
         attributes['attr:ws-creates-context'] = 'default';
      }

      if (!attributes['attr:ws-delegates-tabfocus']) {
         attributes['attr:ws-delegates-tabfocus'] = 'default';
      }

      return;
   }

   if (opts['ws-creates-context'] === 'true') {
      attributes['ws-creates-context'] = 'true';
   } else if(!attributes['ws-creates-context']) {
      attributes['ws-creates-context'] = 'default';
   }

   if (opts['ws-delegates-tabfocus'] === 'true') {
      attributes['ws-delegates-tabfocus'] = 'true';
   } else if(!attributes['ws-delegates-tabfocus']) {
      attributes['ws-delegates-tabfocus'] = 'default';
   }

   if (opts['ws-tab-cycling'] === 'true') {
      attributes['ws-tab-cycling'] = 'true';
   }

   if (opts['ws-autofocus'] === 'true') {
      attributes['ws-autofocus'] = 'true';
   }

   if (opts['ws-no-focus'] === 'true') {
      attributes['ws-no-focus'] = 'true';
   }

   if (opts.hasOwnProperty('tabindex')) {
      attributes['tabindex'] = opts['tabindex'] + '';
   }
}

// поправляет табиндекс для атрибутов, предназначенных для элемента, образующего контекст табиндексов
// табиндекс должен быть по умолчанию 0, табиндекса не может не быть вообще
export function prepareTabindex(attrs) {
   if (attrs['ws-creates-context'] === 'true') {
      if (!attrs.hasOwnProperty('tabindex')) {
         attrs.tabindex = '0';
      }
   }
}

/**
 * Функция выставляет дефолтные атрибуты для фокусов
 * @param attrs - Объект, в котором хранятся атрибуты
 * @param newAttrs - опциональный аргумент, отсюда возьмутся атрибуты, если они есть
 * иначе атрибуты выставятся в true
 */
export function resetDefaultValues(attrs, newAttrs?) {
   if (attrs['ws-creates-context'] === 'default') {
      attrs['ws-creates-context'] = newAttrs && newAttrs['ws-creates-context'] || 'true';
   }
   if (attrs['ws-delegates-tabfocus'] === 'default') {
      attrs['ws-delegates-tabfocus'] = newAttrs && newAttrs['ws-delegates-tabfocus'] || 'true';
   }

   if (attrs['attr:ws-creates-context'] === 'default') {
      attrs['attr:ws-creates-context'] = newAttrs && newAttrs['attr:ws-creates-context'] || 'true';
   }
   if (attrs['attr:ws-delegates-tabfocus'] === 'default') {
      attrs['attr:ws-delegates-tabfocus'] = newAttrs && newAttrs['attr:ws-delegates-tabfocus'] || 'true';
   }
}

/**
 * Функция нужна для патчинга корневых элементов при маутинге
 * Вызывается только из createControl!
 * @param dom
 * @param cfg
 */
export function patchDom(dom, cfg) {
   dom = dom[0] ? dom[0] : dom;
   var attributes = dom.attributes,
      attrObj = {},
      attrList = ['ws-delegates-focus', //Список атрибутов для системы фокусов
         'ws-creates-context',
         'ws-autofocus',
         'tabindex',
         'ws-no-focus'
      ];
   for (var idx in attrList) {
      var attrName = attrList[idx],
         attr = attributes.getNamedItem(attrName);
      if (attr) {
         attrObj[attrName] = attr.value; //Копируем необходимые атрибуты
      }
   }
   prepareAttrsForFocus(attrObj, cfg);
   resetDefaultValues(attrObj, cfg);
   prepareTabindex(attrObj);
   for (var key in attrObj) {
      dom.setAttribute(key, attrObj[key]);
   }
}
