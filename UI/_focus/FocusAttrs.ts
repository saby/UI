/// <amd-module name="UI/_focus/FocusAttrs" />
/* tslint:disable */

/**
 * @author Тэн В.А.
 */

export function prepareAttrsForFocus(attributes) {
   if (!attributes) {
      return;
   }

   if (!attributes['ws-creates-context']) {
      attributes['ws-creates-context'] = 'true';
   }

   if(!attributes['ws-delegates-tabfocus']) {
      attributes['ws-delegates-tabfocus'] = 'true';
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
   prepareAttrsForFocus(attrObj);
   prepareTabindex(attrObj);
   for (var key in attrObj) {
      dom.setAttribute(key, attrObj[key]);
   }
}
